
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


router = APIRouter(tags=['admin'])


@router.get("/admin/complaints", response_model=list[ComplaintOut])
def admin_complaints(department: str | None = None, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Complaint]:
    require_role(current, Role.admin)
    return list_complaints(department, current, db)



@router.get("/admin/staff", response_model=list[UserOut])
def list_staff(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[User]:
    require_role(current, Role.admin)
    return db.query(User).filter(User.role.in_([Role.staff.value, Role.department_head.value])).order_by(User.department, User.username).all()



@router.post("/admin/staff", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_staff(payload: UserCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    require_role(current, Role.admin)
    if not payload.department:
        raise HTTPException(status_code=400, detail="staff must have a department")
    if db.query(User).filter((func.lower(User.email) == payload.email.lower()) | (func.lower(User.username) == (payload.username or "").lower())).first():
        raise HTTPException(status_code=409, detail="email or username already exists")
    user = User(
        email=payload.email.lower(),
        username=payload.username.strip() if payload.username else None,
        hashed_password=hash_password(payload.password),
        role=Role.staff.value,
        department=payload.department,
        profile_completed=True,
    )
    db.add(user)
    db.flush()
    write_audit(db, current, "staff.created", "user", str(user.id), {"department": user.department})
    db.commit()
    db.refresh(user)
    return user



@router.get("/admin/audit-logs", response_model=list[AuditEventOut])
def list_audit_logs(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[AuditLog]:
    require_role(current, Role.admin)
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()


# ─── Student Profile Endpoints ────────────────────────────────────────────────


@router.post("/admin/complaints/{complaint_id}/nudge")
def nudge_complaint(
    complaint_id: str,
    payload: NudgeRequest | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_role(current, Role.admin)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")

    msg = (payload and payload.message) or f"ADMIN EXPEDITE REQUEST: Immediate action required for complaint {complaint.id} ({complaint.title})."

    write_audit(
        db, current, "admin.nudge", "complaint", complaint.id,
        {"department": complaint.department, "title": complaint.title, "message": msg}
    )

    staff_users = db.query(User).filter(
        User.department == complaint.department,
        User.role.in_([Role.staff.value, Role.department_head.value])
    ).all()

    if staff_users:
        for u in staff_users:
            db.add(Notification(
                user_id=u.id,
                complaint_id=complaint.id,
                channel="nudge",
                recipient=u.email,
                subject=f"⚠️ URGENT NUDGE: Complaint {complaint.id}",
                body=msg,
            ))
    else:
        db.add(Notification(
            user_id=None,
            complaint_id=complaint.id,
            channel="nudge",
            recipient=f"{complaint.department}@institution.edu",
            subject=f"⚠️ URGENT NUDGE: Complaint {complaint.id}",
            body=msg,
        ))

    db.commit()
    return {"status": "success", "message": "Nudge sent successfully", "complaint_id": complaint.id}



@router.post("/admin/sla-check")
def run_sla_check(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current, Role.admin)
    return {"escalated": check_slas(db)}



@router.post("/admin/emerging-check")
def run_emerging_check(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current, Role.admin)
    flagged = check_emerging_clusters(db)
    return {"flagged": len(flagged)}


# ── Comment / Message endpoints ──────────────────────────────────────────────
