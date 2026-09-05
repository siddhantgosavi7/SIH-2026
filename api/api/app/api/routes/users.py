
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


router = APIRouter(tags=['users'])


@router.get("/users", response_model=list[UserOut])
def list_users(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[User]:
    require_role(current, Role.admin)
    return db.query(User).order_by(User.created_at.desc()).all()



@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    require_role(current, Role.admin)
    if payload.role in {Role.staff, Role.department_head} and not payload.department:
        raise HTTPException(status_code=400, detail="department staff and heads must have a department")
    existing = db.query(User).filter(func.lower(User.email) == payload.email.lower()).one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="email already exists")
    user = User(
        email=payload.email.lower(),
        username=payload.username.strip() if payload.username else None,
        hashed_password=hash_password(payload.password),
        role=payload.role.value,
        department=payload.department,
        profile_completed=(payload.role.value != Role.student.value),
    )
    db.add(user)
    db.flush()
    write_audit(db, current, "user.created", "user", str(user.id), {"email": user.email, "role": user.role})
    db.commit()
    db.refresh(user)
    return user
