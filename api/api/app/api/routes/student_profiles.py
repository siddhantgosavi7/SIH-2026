
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


router = APIRouter(tags=['student_profiles'])


@router.get("/students/me/profile", response_model=StudentProfileOut)
def get_my_profile(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> StudentProfile:
    """Get the authenticated student's own academic profile."""
    require_role(current, Role.student, check_profile=False)
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current.id).one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="No academic profile found. Please fill in your details.")
    return profile



@router.put("/students/me/profile", response_model=StudentProfileOut)
def upsert_my_profile(
    payload: StudentProfileIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentProfile:
    """Create or update the authenticated student's academic profile."""
    require_role(current, Role.student, check_profile=False)

    # PRN uniqueness check — reject if another user owns this PRN
    prn_conflict = (
        db.query(StudentProfile)
        .filter(StudentProfile.prn_number == payload.prn_number, StudentProfile.user_id != current.id)
        .one_or_none()
    )
    if prn_conflict:
        raise HTTPException(status_code=409, detail="PRN already registered to another account.")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current.id).one_or_none()
    if profile:
        # Update existing
        profile.full_name = payload.full_name
        profile.department = payload.department
        profile.prn_number = payload.prn_number
        profile.division = payload.division
        profile.roll_no = payload.roll_no
        profile.year_semester = payload.year_semester
        profile.contact_number = payload.contact_number
        profile.updated_at = utcnow()
    else:
        profile = StudentProfile(
            user_id=current.id,
            full_name=payload.full_name,
            department=payload.department,
            prn_number=payload.prn_number,
            division=payload.division,
            roll_no=payload.roll_no,
            year_semester=payload.year_semester,
            contact_number=payload.contact_number,
        )
        db.add(profile)
        
    current.profile_completed = True
    db.add(current)

    db.flush()
    write_audit(db, current, "student.profile.upsert", "student_profile", str(current.id), {"prn": payload.prn_number})
    db.commit()
    db.refresh(profile)
    return profile



@router.get("/admin/student-profiles", response_model=list[StudentProfileAdminOut])
def list_student_profiles(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[StudentProfileAdminOut]:
    """Admin: list all student academic profiles with user info."""
    require_role(current, Role.admin)
    rows = (
        db.query(StudentProfile, User.email, User.username)
        .join(User, User.id == StudentProfile.user_id)
        .order_by(StudentProfile.updated_at.desc())
        .all()
    )
    result = []
    for profile, email, username in rows:
        out = StudentProfileAdminOut.model_validate(profile)
        out.user_email = email
        out.username = username
        result.append(out)
    return result



@router.get("/admin/student-profiles/{user_id}", response_model=StudentProfileAdminOut)
def get_student_profile_by_user(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentProfileAdminOut:
    """Admin: get one student's academic profile by user_id."""
    require_role(current, Role.admin)
    row = (
        db.query(StudentProfile, User.email, User.username)
        .join(User, User.id == StudentProfile.user_id)
        .filter(StudentProfile.user_id == user_id)
        .one_or_none()
    )
    if not row:
        raise HTTPException(status_code=404, detail="No academic profile found for this user.")
    profile, email, username = row
    out = StudentProfileAdminOut.model_validate(profile)
    out.user_email = email
    out.username = username
    return out

