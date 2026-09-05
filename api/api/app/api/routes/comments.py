
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


router = APIRouter(tags=['comments'])


@router.get("/complaints/{complaint_id}/comments", response_model=list[CommentOut])
def list_comments(
    complaint_id: str,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all comments/messages on a complaint. Visible to the student who filed it, assigned staff, and admins."""
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.author).joinedload(User.student_profile))
        .filter(Comment.complaint_id == complaint_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return comments



@router.post("/complaints/{complaint_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    complaint_id: str,
    payload: CommentCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Post a comment/message on a complaint. Students, staff, dept heads, and admins can comment."""
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    comment = Comment(
        complaint_id=complaint_id,
        author_id=current.id,
        body=payload.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    # Eagerly load author for response serialization
    db.refresh(comment, attribute_names=["author"])
    if comment.author:
        _ = comment.author.student_profile  # trigger lazy load
    write_audit(db, current, "comment.created", "comment", str(comment.id), {"complaint_id": complaint_id})
    db.commit()
    return comment


# ── Message endpoints ───────────────────────────────────────────────────────
