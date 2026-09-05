
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


router = APIRouter(tags=['dashboard'])


@router.get("/students/me/dashboard")
def student_dashboard(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, int]:
    require_role(current, Role.student)
    counts = dict(db.query(Complaint.status, func.count(Complaint.id)).filter(
        Complaint.student_id == current.id,
        Complaint.deleted_at.is_(None),
    ).group_by(Complaint.status).all())
    return {
        "total": sum(counts.values()),
        "open": counts.get(ComplaintStatus.open.value, 0),
        "in_progress": counts.get(ComplaintStatus.in_progress.value, 0),
        "resolved": counts.get(ComplaintStatus.resolved.value, 0),
        "closed": counts.get(ComplaintStatus.closed.value, 0),
        "escalated": counts.get(ComplaintStatus.escalated.value, 0),
    }



@router.get("/staff/dashboard", response_model=QueueStats)
def staff_dashboard(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> QueueStats:
    require_role(current, Role.staff, Role.department_head)
    return department_dashboard(current, db)



@router.get("/admin/dashboard")
def admin_dashboard(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, int]:
    require_role(current, Role.admin)
    counts = dict(db.query(Complaint.status, func.count(Complaint.id)).filter(
        Complaint.deleted_at.is_(None),
    ).group_by(Complaint.status).all())
    return {
        "total": sum(counts.values()),
        "open": counts.get(ComplaintStatus.open.value, 0),
        "in_progress": counts.get(ComplaintStatus.in_progress.value, 0),
        "resolved": counts.get(ComplaintStatus.resolved.value, 0),
        "closed": counts.get(ComplaintStatus.closed.value, 0),
        "escalated": counts.get(ComplaintStatus.escalated.value, 0),
    }



@router.get("/dashboard/department", response_model=QueueStats)
def department_dashboard(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> QueueStats:
    require_role(current, Role.staff, Role.department_head, Role.admin)
    department = current.department or "all"
    query = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status)
    if current.role in {Role.staff.value, Role.department_head.value}:
        query = query.filter(Complaint.department == current.department)
    stats = QueueStats(department=department)
    for status_name, count in query.all():
        if hasattr(stats, status_name):
            setattr(stats, status_name, count)
    return stats

