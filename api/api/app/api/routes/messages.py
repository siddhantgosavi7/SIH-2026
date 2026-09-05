
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


router = APIRouter(tags=['messages'])


@router.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a direct message to another user."""
    recipient = db.get(User, payload.recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    if recipient.id == current.id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    # If complaint_id provided, verify access
    if payload.complaint_id:
        complaint = db.get(Complaint, payload.complaint_id)
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        enforce_view_complaint(current, complaint)
        # Recipient must also have access to this complaint
        enforce_view_complaint(recipient, complaint)

    subject = payload.subject or f"Message from {current.username or current.email}"
    message = Message(
        sender_id=current.id,
        recipient_id=payload.recipient_id,
        complaint_id=payload.complaint_id,
        subject=subject,
        body=payload.body,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    # Eagerly load relationships for response
    db.refresh(message, attribute_names=["sender", "recipient"])
    if message.sender:
        _ = message.sender.student_profile
    if message.recipient:
        _ = message.recipient.student_profile
    write_audit(db, current, "message.sent", "message", str(message.id), {"recipient_id": recipient.id, "complaint_id": payload.complaint_id})
    db.commit()
    return message



@router.post("/admin/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def admin_send_message(
    payload: MessageCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Message:
    require_role(current, Role.admin)
    return send_message(payload, current, db)



@router.get("/messages/inbox", response_model=list[MessageOut])
def list_inbox(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List received messages for the current user."""
    messages = (
        db.query(Message)
        .options(joinedload(Message.sender).joinedload(User.student_profile))
        .filter(Message.recipient_id == current.id)
        .order_by(Message.created_at.desc())
        .all()
    )
    # Eagerly load sender profiles
    for m in messages:
        if m.sender:
            _ = m.sender.student_profile
    return messages



@router.get("/messages/sent", response_model=list[MessageOut])
def list_sent_messages(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List sent messages for the current user."""
    messages = (
        db.query(Message)
        .options(joinedload(Message.recipient).joinedload(User.student_profile))
        .filter(Message.sender_id == current.id)
        .order_by(Message.created_at.desc())
        .all()
    )
    for m in messages:
        if m.recipient:
            _ = m.recipient.student_profile
    return messages



@router.get("/messages/unread-count")
def get_unread_count(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of unread messages."""
    count = db.query(Message).filter(Message.recipient_id == current.id, Message.is_read == False).count()
    return {"unread_count": count}



@router.get("/messages/{message_id}", response_model=MessageOut)
def get_message(
    message_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific message. Only sender or recipient can view."""
    message = (
        db.query(Message)
        .options(joinedload(Message.sender).joinedload(User.student_profile))
        .options(joinedload(Message.recipient).joinedload(User.student_profile))
        .filter(Message.id == message_id)
        .first()
    )
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.sender_id != current.id and message.recipient_id != current.id:
        raise HTTPException(status_code=403, detail="You can only view your own messages")
    # Eagerly load profiles
    if message.sender:
        _ = message.sender.student_profile
    if message.recipient:
        _ = message.recipient.student_profile
    return message



@router.patch("/messages/{message_id}/read", response_model=MessageOut)
def mark_message_read(
    message_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a message as read."""
    message = db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.recipient_id != current.id:
        raise HTTPException(status_code=403, detail="Only the recipient can mark a message as read")
    message.is_read = True
    db.commit()
    db.refresh(message)
    if message.sender:
        _ = message.sender.student_profile
    if message.recipient:
        _ = message.recipient.student_profile
    return message
