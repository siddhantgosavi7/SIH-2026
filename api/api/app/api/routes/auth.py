
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


router = APIRouter(tags=['auth'])


@router.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    bootstrap_admin(db)
    bootstrap_staff(db)
    username_input = payload.username.strip()

    if "@" in username_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter your username, not an email address to log in."
        )

    user = db.query(User).filter(func.lower(User.username) == username_input.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    token = create_access_token(str(user.id), user.role, user.department)
    write_audit(db, user, "user.login", "user", str(user.id), {"email": user.email, "username": user.username, "role": user.role})
    db.commit()
    return TokenOut(access_token=token, role=user.role, email=user.email, username=user.username, department=user.department, profile_completed=user.profile_completed)



@router.get("/auth/me", response_model=UserOut)
def auth_me(current: User = Depends(get_current_user)) -> User:
    return current



@router.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentRegister, db: Session = Depends(get_db)) -> User:
    email = payload.email.lower().strip()
    username = payload.username.strip()

    if "@" in username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username cannot be an email address")

    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")
    if db.query(User).filter(func.lower(User.username) == username.lower()).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this username already exists")
    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(payload.password),
        role=Role.student.value,
        department=payload.department,
    )
    db.add(user)
    db.flush()
    write_audit(db, None, "student.registered", "user", str(user.id), {"email": user.email, "username": user.username})
    db.commit()
    db.refresh(user)
    return user

