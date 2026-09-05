
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


router = APIRouter(tags=['intake'])


@router.post("/intake/email", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def intake_email(payload: ComplaintCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    require_role(current, Role.staff, Role.admin)
    internal = build_payload(db, payload.title, payload.description)
    complaint = Complaint(
        id=str(uuid4()),
        student_id=current.id,
        department=internal.department,
        title=internal.title,
        description=internal.description,
        affected_users=internal.affected_users,
        source="email",
    )
    db.add(complaint)
    db.flush()
    analyze_complaint(db, complaint)
    assignment = assign_complaint_to_group(db, complaint)
    complaint.affected_users = assignment.group.affected_users
    text_tokens = classify_complaint(db, complaint)
    apply_priority(complaint, text_tokens)
    recalculate_group(db, assignment.group)
    write_audit(
        db,
        current,
        "intake.email.created",
        "complaint",
        complaint.id,
        {"affected_users": complaint.affected_users, "similar_complaints": internal.similar_complaints_count},
    )
    db.commit()
    db.refresh(complaint)
    enqueue_ai_processing(complaint.id)
    return complaint



@router.post("/intake/pdf", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def intake_pdf(
    title: str,
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Complaint:
    require_role(current, Role.staff, Role.admin)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="pdf required")
    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="attachment too large")
    description = f"PDF intake: {file.filename}"
    internal = build_payload(db, title, description)
    complaint = Complaint(
        id=str(uuid4()),
        student_id=current.id,
        department=internal.department,
        title=internal.title,
        description=internal.description,
        affected_users=internal.affected_users,
        source="pdf",
    )
    db.add(complaint)
    db.flush()
    analyze_complaint(db, complaint)
    assignment = assign_complaint_to_group(db, complaint)
    complaint.affected_users = assignment.group.affected_users
    text_tokens = classify_complaint(db, complaint)
    apply_priority(complaint, text_tokens)
    recalculate_group(db, assignment.group)
    target = settings.upload_path / f"{uuid4()}-{Path(file.filename or 'intake.pdf').name}"
    target.write_bytes(content)
    db.add(Attachment(complaint_id=complaint.id, filename=file.filename or "intake.pdf", content_type="application/pdf", size_bytes=len(content), storage_path=str(target)))
    write_audit(db, current, "intake.pdf.created", "complaint", complaint.id)
    db.commit()
    db.refresh(complaint)
    enqueue_ai_processing(complaint.id)
    return complaint

