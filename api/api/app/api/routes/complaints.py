
from datetime import timezone
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload
from app.audit import write_audit
from app.core.config import settings
from app.database import get_db
from app.api.dependencies import get_current_user
from app.idempotency import get_existing, request_hash, store_response
from app.pipeline import analyze_complaint
from app.models import Attachment, AuditLog, Comment, Complaint, ComplaintStatus, DepartmentPolicy, Message, Notification, Priority, ProblemGroup, Role, StudentProfile, User, utcnow
from app.rbac import enforce_view_complaint, require_role
from app.schemas import *
from app.core.security import create_access_token, hash_password, verify_password
from app.workers.queue import enqueue_ai_processing
from app.workers.sla_tasks import check_slas
from app.workers.emerging_tasks import check_emerging_clusters
from app.services.intelligent_intake import build_payload
from app.services.problem_grouping import assign_complaint_to_group, recalculate_group, resolve_problem_group
from app.pipeline.priority import apply_priority
from app.pipeline.classifier import classify_complaint
from app.pipeline.policies import ensure_default_policies
from app.core.constants import DEPARTMENTS, ALLOWED_ATTACHMENT_TYPES, TRANSITIONS

# Ensure bootstrap functions are accessible if needed
from app.main_bootstraps import bootstrap_admin, bootstrap_staff, bootstrap_departments


router = APIRouter(tags=['complaints'])


@router.get("/staff/complaints", response_model=list[ComplaintOut])
def staff_complaints(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Complaint]:
    require_role(current, Role.staff, Role.department_head)
    return list_complaints(None, current, db)



@router.post(
    "/complaints",
    response_model=ComplaintOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_complaint(
    payload: ComplaintCreate,
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a complaint from the public two-field intake contract.

    Public input:
        title + description

    Internal flow:
        1. find historical similar complaints
        2. calculate distinct affected users
        3. create the complaint with that internal impact value
        4. run the existing classification/priority/duplicate pipeline
    """
    require_role(current, Role.student, Role.admin)

    body_hash = await request_hash(request)
    if idempotency_key:
        existing = get_existing(
            db=db,
            user=current,
            key=idempotency_key,
            method=request.method,
            path=request.url.path,
            body_hash=body_hash,
        )
        if existing:
            return JSONResponse(
                status_code=existing.status_code,
                content=existing.response_json,
            )

    internal = build_payload(
        db=db,
        title=payload.title,
        description=payload.description,
    )

    complaint = Complaint(
        id=str(uuid4()),
        student_id=current.id,
        title=internal.title,
        description=internal.description,
        department=internal.department,
        # The authoritative impact value is calculated after the complaint
        # has been attached to a ProblemGroup.
        affected_users=1,
        source="web",
    )
    
    if internal.category:
        complaint.category = internal.category
    if internal.priority:
        complaint.priority = internal.priority
    if internal.priority_reasons:
        complaint.priority_reasons = internal.priority_reasons
        
    complaint.classification_source = internal.classification_source
    complaint.classification_confidence = internal.classification_confidence

    db.add(complaint)
    db.flush()

    # Existing downstream pipeline: classification -> priority -> relations.
    analyze_complaint(db, complaint)

    # Create/find the department-facing Core Problem and derive the distinct
    # affected-student count from all complaints in that group.
    assignment = assign_complaint_to_group(db, complaint, force_new=payload.force_new)
    complaint.affected_users = assignment.group.affected_users

    # The new Priority Engine handles escalation automatically based on signals.
    # Therefore, no hardcoded priority escalation is needed here anymore.

    recalculate_group(db, assignment.group)

    assignee = (
        db.query(User)
        .filter(
            User.department == complaint.department,
            User.role.in_([Role.staff.value, Role.department_head.value]),
        )
        .order_by(User.id)
        .first()
    )
    if assignee:
        complaint.assigned_to_id = assignee.id

    write_audit(
        db=db,
        actor=current,
        action="complaint.created",
        entity_type="complaint",
        entity_id=complaint.id,
        metadata={
            "department": complaint.department,
            "affected_users": complaint.affected_users,
            "similar_complaints": internal.similar_complaints_count,
            "similar_complaint_ids": list(internal.similar_complaint_ids),
            "force_new": payload.force_new,
        },
    )

    db.commit()
    db.refresh(complaint)

    # Use getattr to safely access request_id, as testing context might not set it
    req_id = getattr(request.state, "request_id", None)
    
    from app.logger import get_complaint_logger
    complaint_logger = get_complaint_logger("api.complaints")
    complaint_logger.info(
        "Complaint created and grouped",
        extra={
            "complaint_id": complaint.id,
            "department": complaint.department,
            "priority": complaint.priority,
            "classification_source": complaint.classification_source,
            "request_id": req_id,
            "user_id": current.id
        }
    )

    response = ComplaintOut.model_validate(complaint).model_dump(mode="json")
    if idempotency_key:
        store_response(
            db=db,
            user=current,
            key=idempotency_key,
            method=request.method,
            path=request.url.path,
            body_hash=body_hash,
            response=response,
            status_code=status.HTTP_201_CREATED,
        )
        db.commit()

    enqueue_ai_processing(complaint.id)
    return complaint


@router.get("/complaints", response_model=list[ComplaintOut])
def list_complaints(
    department: str | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[Complaint]:
    query = (
        db.query(Complaint)
        .options(joinedload(Complaint.student).joinedload(User.student_profile))
        .filter(Complaint.deleted_at.is_(None))
        .order_by(Complaint.created_at.desc())
    )
    if current.role == Role.student.value:
        query = query.filter(Complaint.student_id == current.id)
    elif current.role in {Role.staff.value, Role.department_head.value}:
        query = query.filter(Complaint.department == current.department)
    elif current.role == Role.admin.value and department:
        query = query.filter(Complaint.department == department)
    return query.all()



@router.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.student).joinedload(User.student_profile))
        .filter(Complaint.id == complaint_id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    return complaint



@router.patch("/complaints/{complaint_id}/transition", response_model=ComplaintOut)
def transition_complaint(
    complaint_id: str,
    payload: ComplaintTransition,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Complaint:
    require_role(current, Role.staff, Role.department_head, Role.admin)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if payload.status.value not in TRANSITIONS[complaint.status]:
        raise HTTPException(status_code=409, detail=f"cannot transition {complaint.status} to {payload.status.value}")
    old_status = complaint.status
    complaint.status = payload.status.value
    if complaint.problem_group_id:
        group = db.get(ProblemGroup, complaint.problem_group_id)
        if group:
            recalculate_group(db, group)
    write_audit(db, current, "complaint.transitioned", "complaint", complaint.id, {"from": old_status, "to": complaint.status, "note": payload.note})
    db.commit()
    db.refresh(complaint)
    
    if complaint.status == "resolved":
        from app.logger import get_complaint_logger
        complaint_logger = get_complaint_logger("api.complaints")
        complaint_logger.info(
            "Complaint resolved",
            extra={
                "complaint_id": complaint.id,
                "department": complaint.department,
                "user_id": current.id
            }
        )

    return complaint



@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintOut)
def update_complaint_status(
    complaint_id: str,
    payload: ComplaintTransition,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Complaint:
    return transition_complaint(complaint_id, payload, current, db)



@router.put("/complaints/{complaint_id}/solution", response_model=ComplaintOut)
def provide_solution(
    complaint_id: str,
    payload: SolutionIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Complaint:
    require_role(current, Role.staff, Role.department_head, Role.admin)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if complaint.problem_group_id:
        group = db.get(ProblemGroup, complaint.problem_group_id)
        if group:
            # A grouped complaint represents one real-world problem. Solving
            # an individual member therefore resolves the canonical problem
            # and notifies every student who reported/joined that problem.
            resolve_problem_group(db, group, payload.solution, current)
        else:
            complaint.solution_text = payload.solution
            complaint.solution_by_id = current.id
            complaint.solution_at = utcnow()
            complaint.status = ComplaintStatus.resolved.value
            write_audit(db, current, "complaint.solution.provided", "complaint", complaint.id, {"solution_by_id": current.id})
    else:
        complaint.solution_text = payload.solution
        complaint.solution_by_id = current.id
        complaint.solution_at = utcnow()
        complaint.status = ComplaintStatus.resolved.value
        write_audit(db, current, "complaint.solution.provided", "complaint", complaint.id, {"solution_by_id": current.id})
    db.commit()
    db.refresh(complaint)
    return complaint



@router.get("/complaints/{complaint_id}/solution", response_model=SolutionOut)
def get_solution(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SolutionOut:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if not complaint.solution_text:
        raise HTTPException(status_code=404, detail="solution not available")
    return SolutionOut(complaint_id=complaint.id, solution=complaint.solution_text, staff_id=complaint.solution_by_id, resolved_at=complaint.solution_at)



@router.post("/complaints/{complaint_id}/feedback", response_model=ComplaintOut)
def submit_feedback(
    complaint_id: str,
    payload: FeedbackIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Complaint:
    require_role(current, Role.student)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if not complaint.solution_text:
        raise HTTPException(status_code=409, detail="complaint has no solution to review")
    complaint.feedback_accepted = payload.accepted
    complaint.feedback_comment = payload.comment
    complaint.feedback_at = utcnow()
    complaint.status = ComplaintStatus.closed.value if payload.accepted else ComplaintStatus.in_progress.value
    if complaint.problem_group_id:
        group = db.get(ProblemGroup, complaint.problem_group_id)
        if group:
            recalculate_group(db, group)
    write_audit(db, current, "complaint.feedback.submitted", "complaint", complaint.id, {"accepted": payload.accepted})
    db.commit()
    db.refresh(complaint)
    return complaint



@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintOut)
def assign_complaint(complaint_id: str, payload: AssignmentRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    require_role(current, Role.staff, Role.department_head, Role.admin)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    assignee = db.get(User, payload.user_id)
    if not assignee or assignee.role not in {Role.staff.value, Role.department_head.value} or assignee.department != complaint.department:
        raise HTTPException(status_code=400, detail="assignee must be staff in the complaint department")
    complaint.assigned_to_id = assignee.id
    write_audit(db, current, "complaint.assigned", "complaint", complaint.id, {"assignee_id": assignee.id, "note": payload.note})
    db.commit()
    db.refresh(complaint)
    return complaint



@router.post("/complaints/{complaint_id}/reopen", response_model=ComplaintOut)
def reopen_complaint(complaint_id: str, payload: ReopenRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    require_role(current, Role.student)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if complaint.status not in {ComplaintStatus.resolved.value, ComplaintStatus.closed.value}:
        raise HTTPException(status_code=409, detail="only resolved complaints can be reopened")
    complaint.status = ComplaintStatus.in_progress.value
    if complaint.problem_group_id:
        group = db.get(ProblemGroup, complaint.problem_group_id)
        if group:
            recalculate_group(db, group)
    write_audit(db, current, "complaint.reopened", "complaint", complaint.id, {"reason": payload.reason})
    db.commit()
    db.refresh(complaint)
    return complaint



@router.get("/complaints/{complaint_id}/timeline", response_model=list[AuditEventOut])
def complaint_timeline(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[AuditLog]:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    return db.query(AuditLog).filter_by(entity_type="complaint", entity_id=complaint_id).order_by(AuditLog.created_at).all()



@router.delete("/complaints/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(
    complaint_id: str,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if current.role == Role.student.value and complaint.student_id != current.id:
        raise HTTPException(status_code=404, detail="complaint not found")
    if current.role in {Role.staff.value, Role.department_head.value}:
        raise HTTPException(status_code=403, detail="staff cannot delete complaints")
    
    if complaint.deleted_at is not None:
        raise HTTPException(status_code=404, detail="complaint already deleted")
    complaint.deleted_at = utcnow()
    if complaint.problem_group_id:
        group = db.get(ProblemGroup, complaint.problem_group_id)
        if group:
            recalculate_group(db, group)
    write_audit(db, current, "complaint.deleted", "complaint", complaint.id, {"title": complaint.title, "department": complaint.department, "status": complaint.status})
    db.commit()



@router.get("/complaints/{complaint_id}/attachments", response_model=list[AttachmentOut])
def list_attachments(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Attachment]:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    return db.query(Attachment).filter(Attachment.complaint_id == complaint.id).order_by(Attachment.created_at).all()



import re

MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"%PDF": "application/pdf",
}

def validate_file_type(content: bytes, claimed_type: str) -> bool:
    for magic, mime in MAGIC_BYTES.items():
        if content.startswith(magic):
            return mime == claimed_type
    # Text files don't have magic bytes — check for binary content
    if claimed_type == "text/plain":
        try:
            content[:1024].decode("utf-8")
            return True
        except UnicodeDecodeError:
            return False
    return False

def sanitize_filename(name: str) -> str:
    name = Path(name).name  # Strip path components
    name = re.sub(r'[^\w\-.]', '_', name)  # Replace dangerous chars
    return name[:200]  # Limit length

@router.post("/complaints/{complaint_id}/attachments", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
async def add_attachment(
    complaint_id: str,
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
        raise HTTPException(status_code=415, detail="unsupported attachment type")
    
    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="attachment too large")
        
    if not validate_file_type(content, file.content_type):
        raise HTTPException(status_code=415, detail="content does not match declared type")

    safe_filename = sanitize_filename(file.filename or 'upload')
    name = f"{uuid4()}-{safe_filename}"
    target = settings.upload_path / name
    
    # Path traversal protection
    if not target.resolve().is_relative_to(settings.upload_path.resolve()):
        raise HTTPException(status_code=400, detail="invalid filename")

    target.write_bytes(content)
    attachment = Attachment(
        complaint_id=complaint.id,
        filename=safe_filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        storage_path=str(target),
    )
    db.add(attachment)
    write_audit(db, current, "attachment.created", "complaint", complaint.id, {"filename": attachment.filename})
    db.commit()
    db.refresh(attachment)
    return attachment



@router.get("/complaints/{complaint_id}/attachments/{attachment_id}")
def get_attachment_file(
    complaint_id: str,
    attachment_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    attachment = db.query(Attachment).filter(
        Attachment.id == attachment_id,
        Attachment.complaint_id == complaint.id,
    ).first()
    if not attachment or not Path(attachment.storage_path).exists():
        raise HTTPException(status_code=404, detail="attachment file not found")
    return FileResponse(
        path=attachment.storage_path,
        filename=attachment.filename,
        media_type=attachment.content_type,
    )

