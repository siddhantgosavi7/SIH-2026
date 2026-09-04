
from datetime import timezone
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import func, select, case
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


router = APIRouter(tags=['departments'])


@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)) -> list[dict]:
    bootstrap_departments(db)
    policies = db.query(DepartmentPolicy).filter(DepartmentPolicy.active == True).all()
    if not policies:
        return [{"name": dept, "category": dept, "active": True} for dept in DEPARTMENTS]
    return [{"name": p.name, "category": p.category, "active": p.active} for p in policies]



@router.get("/admin/departments/overview", response_model=list[DepartmentOverview])
def get_departments_overview(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[DepartmentOverview]:
    require_role(current, Role.admin)
    now = utcnow()
    # Query aggregated stats from DB directly
    stats_query = db.query(
        Complaint.department,
        func.count(Complaint.id).label('total'),
        func.sum(case((Complaint.status == ComplaintStatus.open.value, 1), else_=0)).label('open'),
        func.sum(case((Complaint.status == ComplaintStatus.in_progress.value, 1), else_=0)).label('in_progress'),
        func.sum(case((Complaint.status.in_([ComplaintStatus.resolved.value, ComplaintStatus.closed.value]), 1), else_=0)).label('resolved'),
        func.sum(case((
            (Complaint.status.notin_([ComplaintStatus.resolved.value, ComplaintStatus.closed.value])) & 
            (Complaint.sla_due_at < now), 1
        ), else_=0)).label('overdue')
    ).filter(
        Complaint.deleted_at.is_(None)
    ).group_by(Complaint.department).all()

    dept_stats: dict[str, DepartmentOverview] = {
        dept: DepartmentOverview(department=dept) for dept in DEPARTMENTS
    }

    for row in stats_query:
        dept = row.department
        if dept not in dept_stats:
            dept_stats[dept] = DepartmentOverview(department=dept)
        
        dept_stats[dept].total = row.total or 0
        dept_stats[dept].open = row.open or 0
        dept_stats[dept].in_progress = row.in_progress or 0
        dept_stats[dept].resolved = row.resolved or 0
        dept_stats[dept].overdue = row.overdue or 0

    return list(dept_stats.values())



@router.post("/admin/departments/{department_name}/nudge")
def nudge_department(
    department_name: str,
    payload: NudgeRequest | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_role(current, Role.admin)
    if department_name not in DEPARTMENTS:
        raise HTTPException(status_code=404, detail=f"Department '{department_name}' not found")

    msg = (payload and payload.message) or f"ADMIN EXPEDITE REQUEST: Please clear pending open/in-progress queue for {department_name} department."

    write_audit(
        db, current, "admin.department_nudge", "department", department_name,
        {"department": department_name, "message": msg}
    )

    staff_users = db.query(User).filter(
        User.department == department_name,
        User.role.in_([Role.staff.value, Role.department_head.value])
    ).all()

    open_complaints = db.query(Complaint).filter(
        Complaint.department == department_name,
        Complaint.status.in_([ComplaintStatus.open.value, ComplaintStatus.in_progress.value]),
        Complaint.deleted_at.is_(None)
    ).all()

    for c in open_complaints:
        if staff_users:
            for u in staff_users:
                db.add(Notification(
                    user_id=u.id,
                    complaint_id=c.id,
                    channel="nudge",
                    recipient=u.email,
                    subject=f"⚠️ URGENT QUEUE NUDGE: {department_name}",
                    body=msg,
                ))
        else:
            db.add(Notification(
                user_id=None,
                complaint_id=c.id,
                channel="nudge",
                recipient=f"{department_name}@institution.edu",
                subject=f"⚠️ URGENT QUEUE NUDGE: {department_name}",
                body=msg,
            ))

    db.commit()
    return {"status": "success", "message": f"Nudge sent to {department_name}", "affected_complaints": len(open_complaints)}

