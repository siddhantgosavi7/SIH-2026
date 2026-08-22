"""Persistent complaint lifecycle service."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain import ACTIVE_STATUSES, ALLOWED_TRANSITIONS, ComplaintStatus
from app.models.complaint import (
    Complaint,
    ComplaintAuditEvent,
    Department,
    IdempotencyRecord,
)
from app.schemas.complaints import (
    AnalyticsRead,
    AssignmentCreate,
    ComplaintCreate,
    ComplaintRead,
    ResolutionCreate,
    ValidationCreate,
)
from app.services.intelligence import classify, normalize, priority, token_similarity

DEPARTMENTS = (("hostel", "Hostel"), ("exam-cell", "Exam Cell"), ("academics", "Academics / HOD"))


def now() -> datetime:
    return datetime.now(UTC)


def as_read(complaint: Complaint) -> ComplaintRead:
    return ComplaintRead(
        id=complaint.id, student_id=complaint.student_id, original_text=complaint.original_text,
        category=complaint.category, subcategory=complaint.subcategory,
        classification_confidence=complaint.classification_confidence, priority_score=complaint.priority_score,
        priority_level=complaint.priority_level, priority_reasons=complaint.priority_reasons,
        status=ComplaintStatus(complaint.status), department_id=complaint.department_id,
        assigned_to=complaint.assigned_to, cluster_id=complaint.cluster_id, related_count=complaint.related_count,
        sla_due_at=complaint.sla_due_at, escalation_level=complaint.escalation_level,
        resolution=complaint.resolution, created_at=complaint.created_at, updated_at=complaint.updated_at,
        audit_events=[{"event_type": event.event_type, "actor": event.actor, "created_at": event.created_at, "payload": event.payload} for event in complaint.audit_events],
    )


async def ensure_departments(session: AsyncSession) -> None:
    for department_id, name in DEPARTMENTS:
        if not await session.get(Department, department_id):
            session.add(Department(id=department_id, name=name))


async def get_complaint(session: AsyncSession, complaint_id: str) -> Complaint | None:
    result = await session.execute(select(Complaint).where(Complaint.id == complaint_id).options(selectinload(Complaint.audit_events)))
    return result.scalar_one_or_none()


async def create_complaint(session: AsyncSession, payload: ComplaintCreate, student_id: str, idempotency_key: str | None, correlation_id: str) -> Complaint:
    if idempotency_key:
        record = await session.get(IdempotencyRecord, idempotency_key)
        if record:
            complaint = await get_complaint(session, record.complaint_id)
            if complaint:
                return complaint
    await ensure_departments(session)
    classification = classify(payload.text)
    active = await session.execute(select(Complaint).where(Complaint.status.in_([status.value for status in ACTIVE_STATUSES]), Complaint.category == classification.category))
    related = [item for item in active.scalars() if token_similarity(item.original_text, payload.text) >= 0.45]
    related_count = len(related)
    score, level, reasons = priority(payload.text, payload.affected_users, related_count)
    created_at = now()
    complaint_id = f"CMP-{created_at.year}-{uuid4().hex[:8].upper()}"
    cluster_id = None
    if related:
        cluster_id = related[0].cluster_id or f"CLU-{uuid4().hex[:8].upper()}"
        for item in related:
            item.cluster_id = cluster_id
            item.related_count += 1
            item.updated_at = created_at
    complaint = Complaint(
        id=complaint_id, student_id=student_id, original_text=payload.text, normalized_text=normalize(payload.text), source=payload.source,
        category=classification.category, subcategory=classification.subcategory, classification_confidence=classification.confidence,
        priority_score=score, priority_level=level.value, priority_reasons=reasons,
        status=(ComplaintStatus.REVIEW_REQUIRED if classification.confidence < 0.60 else ComplaintStatus.ROUTED).value,
        department_id=classification.department_id, cluster_id=cluster_id, related_count=related_count,
        sla_due_at=created_at + timedelta(hours=4 if score >= 60 else 24), created_at=created_at, updated_at=created_at,
    )
    session.add(complaint)
    if idempotency_key:
        session.add(IdempotencyRecord(key=idempotency_key, complaint_id=complaint_id, created_at=created_at))
    await audit(session, complaint, "complaint.created", student_id, correlation_id, {"source": payload.source})
    await audit(session, complaint, "complaint.classified", "system", correlation_id, {"category": complaint.category, "confidence": complaint.classification_confidence})
    await audit(session, complaint, "complaint.prioritized", "system", correlation_id, {"score": complaint.priority_score, "reasons": complaint.priority_reasons})
    await audit(session, complaint, "complaint.duplicate_detected" if related else "complaint.routed", "system", correlation_id, {"cluster_id": cluster_id, "department_id": complaint.department_id, "related_count": related_count})
    await session.commit()
    return (await get_complaint(session, complaint_id))  # type: ignore[return-value]


async def audit(session: AsyncSession, complaint: Complaint, event_type: str, actor: str, correlation_id: str, payload: dict) -> None:
    session.add(ComplaintAuditEvent(complaint_id=complaint.id, event_type=event_type, actor=actor, correlation_id=correlation_id, payload=payload, created_at=now()))


async def transition(session: AsyncSession, complaint: Complaint, target: ComplaintStatus, actor: str, correlation_id: str, reason: str) -> Complaint:
    current = ComplaintStatus(complaint.status)
    if target not in ALLOWED_TRANSITIONS[current]:
        raise ValueError(f"Cannot transition from {current.value} to {target.value}")
    complaint.status = target.value
    complaint.updated_at = now()
    if target == ComplaintStatus.CLOSED:
        complaint.closed_at = complaint.updated_at
    await audit(session, complaint, f"complaint.{target.value}", actor, correlation_id, {"from": current.value, "reason": reason})
    await session.commit()
    return (await get_complaint(session, complaint.id))  # type: ignore[return-value]


async def assign(session: AsyncSession, complaint: Complaint, payload: AssignmentCreate, actor: str, correlation_id: str) -> Complaint:
    complaint.assigned_to = payload.assignee
    return await transition(session, complaint, ComplaintStatus.ASSIGNED, actor, correlation_id, f"Assigned to {payload.assignee}")


async def resolve(session: AsyncSession, complaint: Complaint, payload: ResolutionCreate, actor: str, correlation_id: str) -> Complaint:
    complaint.resolution = payload.resolution
    complaint.resolved_at = now()
    await transition(session, complaint, ComplaintStatus.RESOLVED, actor, correlation_id, "Resolution submitted")
    refreshed = await get_complaint(session, complaint.id)
    return await transition(session, refreshed, ComplaintStatus.VALIDATION_PENDING, "system", correlation_id, "Student validation requested")  # type: ignore[arg-type]


async def validate(session: AsyncSession, complaint: Complaint, payload: ValidationCreate, actor: str, correlation_id: str) -> Complaint:
    target = ComplaintStatus.CLOSED if payload.accepted else ComplaintStatus.REOPENED
    return await transition(session, complaint, target, actor, correlation_id, payload.comment or ("Resolution accepted" if payload.accepted else "Student requested reopening"))


async def list_complaints(session: AsyncSession, department_id: str | None = None) -> list[Complaint]:
    statement = select(Complaint).options(selectinload(Complaint.audit_events)).order_by(Complaint.priority_score.desc(), Complaint.created_at)
    if department_id:
        statement = statement.where(Complaint.department_id == department_id)
    return list((await session.execute(statement)).scalars())


async def analytics(session: AsyncSession) -> AnalyticsRead:
    complaints = await list_complaints(session)
    total = len(complaints)
    departments: dict[str, int] = {}
    categories: dict[str, int] = {}
    for complaint in complaints:
        departments[complaint.department_id or "review-queue"] = departments.get(complaint.department_id or "review-queue", 0) + 1
        categories[complaint.category] = categories.get(complaint.category, 0) + 1
    current_time = now()
    return AnalyticsRead(
        active_backlog=sum(complaint.status in {status.value for status in ACTIVE_STATUSES} for complaint in complaints),
        resolved_total=sum(complaint.status in {ComplaintStatus.RESOLVED.value, ComplaintStatus.VALIDATION_PENDING.value, ComplaintStatus.CLOSED.value} for complaint in complaints),
        breached_slas=sum(bool(complaint.sla_due_at and complaint.sla_due_at < current_time and complaint.status in {status.value for status in ACTIVE_STATUSES}) for complaint in complaints),
        reopen_rate=round(sum(complaint.status == ComplaintStatus.REOPENED.value for complaint in complaints) / total, 2) if total else 0,
        by_department=departments, by_category=categories, duplicate_clusters=len({complaint.cluster_id for complaint in complaints if complaint.cluster_id}),
    )
