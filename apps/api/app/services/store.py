"""Thread-safe repository used for the runnable demo and test suite.

Swap this adapter for SQLAlchemy/Postgres without changing routes or services.
"""

from collections import Counter
from datetime import UTC, datetime, timedelta
from threading import RLock
from uuid import uuid4

from app.domain import ACTIVE_STATUSES, ALLOWED_TRANSITIONS, ComplaintStatus
from app.schemas.complaints import AnalyticsRead, AuditEvent, ComplaintCreate, ComplaintRead
from app.services.intelligence import classify, priority, token_similarity


class ComplaintStore:
    def __init__(self) -> None:
        self._items: dict[str, ComplaintRead] = {}
        self._keys: dict[str, str] = {}
        self._lock = RLock()

    def create(self, payload: ComplaintCreate, student_id: str, idempotency_key: str | None) -> ComplaintRead:
        with self._lock:
            if idempotency_key and idempotency_key in self._keys:
                return self._items[self._keys[idempotency_key]]
            now = datetime.now(UTC)
            complaint_id = f"CMP-{now.year}-{len(self._items) + 1:06d}"
            classification = classify(payload.text)
            related = [item for item in self._items.values() if item.status in ACTIVE_STATUSES and item.category == classification.category and token_similarity(item.original_text, payload.text) >= 0.45]
            related_count = len(related)
            score, level, reasons = priority(payload.text, payload.affected_users, related_count)
            status = ComplaintStatus.REVIEW_REQUIRED if classification.confidence < 0.60 else ComplaintStatus.ROUTED
            cluster_id = related[0].cluster_id or f"CLU-{uuid4().hex[:8].upper()}" if related else None
            if related and not related[0].cluster_id:
                related[0].cluster_id = cluster_id
            item = ComplaintRead(
                id=complaint_id, student_id=student_id, original_text=payload.text, category=classification.category,
                subcategory=classification.subcategory, classification_confidence=classification.confidence,
                priority_score=score, priority_level=level, priority_reasons=reasons, status=status,
                department_id=classification.department_id, assigned_to=None, cluster_id=cluster_id, related_count=related_count,
                sla_due_at=now + timedelta(hours=4 if score >= 60 else 24), created_at=now, updated_at=now,
                audit_events=[]
            )
            self._items[complaint_id] = item
            if idempotency_key:
                self._keys[idempotency_key] = complaint_id
            self._audit(item, "complaint.created", student_id, {"source": payload.source})
            self._audit(item, "complaint.classified", "system", {"category": item.category, "confidence": item.classification_confidence})
            self._audit(item, "complaint.prioritized", "system", {"score": item.priority_score, "reasons": item.priority_reasons})
            if related:
                self._audit(item, "complaint.duplicate_detected", "system", {"cluster_id": cluster_id, "related_count": related_count})
            self._audit(item, "complaint.routed" if item.department_id else "complaint.review_required", "system", {"department_id": item.department_id})
            return item

    def get(self, complaint_id: str) -> ComplaintRead | None:
        return self._items.get(complaint_id)

    def list(self, department_id: str | None = None) -> list[ComplaintRead]:
        items = list(self._items.values())
        if department_id:
            items = [item for item in items if item.department_id == department_id]
        return sorted(items, key=lambda item: (-item.priority_score, item.created_at))

    def assign(self, item: ComplaintRead, assignee: str, actor: str) -> ComplaintRead:
        item.assigned_to = assignee
        self._transition(item, ComplaintStatus.ASSIGNED, actor, f"Assigned to {assignee}")
        return item

    def transition(self, item: ComplaintRead, target: ComplaintStatus, actor: str, reason: str) -> ComplaintRead:
        self._transition(item, target, actor, reason)
        return item

    def resolve(self, item: ComplaintRead, resolution: str, actor: str) -> ComplaintRead:
        item.resolution = resolution
        self._transition(item, ComplaintStatus.RESOLVED, actor, "Resolution submitted")
        self._transition(item, ComplaintStatus.VALIDATION_PENDING, "system", "Student validation requested")
        return item

    def validate(self, item: ComplaintRead, accepted: bool, actor: str, comment: str | None) -> ComplaintRead:
        target = ComplaintStatus.CLOSED if accepted else ComplaintStatus.REOPENED
        self._transition(item, target, actor, comment or ("Resolution accepted" if accepted else "Student requested reopening"))
        return item

    def analytics(self) -> AnalyticsRead:
        items = list(self._items.values())
        return AnalyticsRead(
            active_backlog=sum(item.status in ACTIVE_STATUSES for item in items),
            resolved_total=sum(item.status in {ComplaintStatus.RESOLVED, ComplaintStatus.VALIDATION_PENDING, ComplaintStatus.CLOSED} for item in items),
            breached_slas=sum(bool(item.sla_due_at and item.sla_due_at < datetime.now(UTC) and item.status in ACTIVE_STATUSES) for item in items),
            reopen_rate=round(sum(item.status == ComplaintStatus.REOPENED for item in items) / len(items), 2) if items else 0,
            by_department=dict(Counter(item.department_id or "review-queue" for item in items)),
            by_category=dict(Counter(item.category for item in items)),
            duplicate_clusters=len({item.cluster_id for item in items if item.cluster_id}),
        )

    @staticmethod
    def _audit(item: ComplaintRead, event_type: str, actor: str, payload: dict) -> None:
        item.audit_events.append(AuditEvent(event_type=event_type, actor=actor, created_at=datetime.now(UTC), payload=payload))
        item.updated_at = datetime.now(UTC)

    def _transition(self, item: ComplaintRead, target: ComplaintStatus, actor: str, reason: str) -> None:
        if target not in ALLOWED_TRANSITIONS[item.status]:
            raise ValueError(f"Cannot transition from {item.status} to {target}")
        previous = item.status
        item.status = target
        self._audit(item, f"complaint.{target}", actor, {"from": previous, "reason": reason})


store = ComplaintStore()
