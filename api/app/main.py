from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.idempotency import get_existing, request_hash, store_response
from app.logging_config import configure_logging
from app.models import Attachment, Complaint, ComplaintStatus, Notification, Priority, Role, User
from app.rate_limit import RateLimiter
from app.rbac import enforce_view_complaint, require_role
from app.schemas import (
    AttachmentOut,
    ComplaintCreate,
    ComplaintOut,
    ComplaintTransition,
    LoginIn,
    NotificationOut,
    QueueStats,
    StudentRegister,
    TokenOut,
    UserCreate,
    UserOut,
)
from app.security import create_access_token, hash_password, verify_password
from app.tasks import check_slas, enqueue_ai_processing

ALLOWED_ATTACHMENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "text/plain"}
TRANSITIONS = {
    ComplaintStatus.open.value: {ComplaintStatus.in_progress.value, ComplaintStatus.escalated.value, ComplaintStatus.resolved.value},
    ComplaintStatus.in_progress.value: {ComplaintStatus.resolved.value, ComplaintStatus.escalated.value},
    ComplaintStatus.escalated.value: {ComplaintStatus.in_progress.value, ComplaintStatus.resolved.value},
    ComplaintStatus.resolved.value: {ComplaintStatus.closed.value, ComplaintStatus.in_progress.value},
    ComplaintStatus.closed.value: set(),
}

configure_logging()
app = FastAPI(title="SIH Complaint Platform", version="1.0.0", dependencies=[Depends(RateLimiter())])
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    settings.upload_path.mkdir(parents=True, exist_ok=True)


def bootstrap_admin(db: Session) -> None:
    if not settings.admin_email or not settings.admin_password:
        return
    existing = db.query(User).filter(func.lower(User.email) == settings.admin_email.lower()).one_or_none()
    if not existing:
        db.add(
            User(
                email=settings.admin_email.lower(),
                hashed_password=hash_password(settings.admin_password),
                role=Role.admin.value,
                department=None,
            )
        )
        db.commit()


@app.get("/health/live")
def live() -> dict:
    return {"status": "ok"}


@app.get("/health/ready")
def ready(db: Session = Depends(get_db)) -> dict:
    db.execute(select(1))
    return {"status": "ready"}


@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    bootstrap_admin(db)
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    token = create_access_token(str(user.id), user.role, user.department)
    return TokenOut(access_token=token, role=user.role, department=user.department)


@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: StudentRegister, db: Session = Depends(get_db)) -> User:
    email = payload.email.lower()
    if db.query(User).filter(func.lower(User.email) == email).one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email already exists")
    user = User(email=email, hashed_password=hash_password(payload.password), role=Role.student.value, department=None)
    db.add(user)
    db.flush()
    write_audit(db, None, "student.registered", "user", str(user.id), {"email": user.email})
    db.commit()
    db.refresh(user)
    return user


@app.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    require_role(current, Role.admin)
    if payload.role == Role.staff and not payload.department:
        raise HTTPException(status_code=400, detail="staff must have department")
    existing = db.query(User).filter(func.lower(User.email) == payload.email.lower()).one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="email already exists")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=payload.role.value,
        department=payload.department,
    )
    db.add(user)
    db.flush()
    write_audit(db, current, "user.created", "user", str(user.id), {"email": user.email, "role": user.role})
    db.commit()
    db.refresh(user)
    return user


@app.post("/complaints", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_role(current, Role.student, Role.admin)
    body_hash = await request_hash(request)
    if idempotency_key:
        existing = get_existing(db, current, idempotency_key, request.method, request.url.path, body_hash)
        if existing:
            return JSONResponse(status_code=existing.status_code, content=existing.response_json)
    complaint = Complaint(
        id=str(uuid4()),
        student_id=current.id,
        department=payload.department,
        title=payload.title,
        description=payload.description,
        priority=payload.priority.value,
    )
    db.add(complaint)
    write_audit(db, current, "complaint.created", "complaint", complaint.id, {"department": complaint.department})
    db.commit()
    db.refresh(complaint)
    response = ComplaintOut.model_validate(complaint).model_dump(mode="json")
    if idempotency_key:
        store_response(db, current, idempotency_key, request.method, request.url.path, body_hash, response, status.HTTP_201_CREATED)
        db.commit()
    enqueue_ai_processing(complaint.id)
    return complaint


@app.get("/complaints", response_model=list[ComplaintOut])
def list_complaints(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Complaint]:
    query = db.query(Complaint).order_by(Complaint.created_at.desc())
    if current.role == Role.student.value:
        query = query.filter(Complaint.student_id == current.id)
    elif current.role == Role.staff.value:
        query = query.filter(Complaint.department == current.department)
    return query.all()


@app.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    return complaint


@app.patch("/complaints/{complaint_id}/transition", response_model=ComplaintOut)
def transition_complaint(
    complaint_id: str,
    payload: ComplaintTransition,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Complaint:
    require_role(current, Role.staff, Role.admin)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if payload.status.value not in TRANSITIONS[complaint.status]:
        raise HTTPException(status_code=409, detail=f"cannot transition {complaint.status} to {payload.status.value}")
    old_status = complaint.status
    complaint.status = payload.status.value
    write_audit(db, current, "complaint.transitioned", "complaint", complaint.id, {"from": old_status, "to": complaint.status, "note": payload.note})
    db.commit()
    db.refresh(complaint)
    return complaint


@app.get("/complaints/{complaint_id}/attachments", response_model=list[AttachmentOut])
def list_attachments(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Attachment]:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    return db.query(Attachment).filter(Attachment.complaint_id == complaint.id).order_by(Attachment.created_at).all()


@app.post("/complaints/{complaint_id}/attachments", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
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
    name = f"{uuid4()}-{Path(file.filename or 'upload').name}"
    target = settings.upload_path / name
    target.write_bytes(content)
    attachment = Attachment(
        complaint_id=complaint.id,
        filename=file.filename or name,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        storage_path=str(target),
    )
    db.add(attachment)
    write_audit(db, current, "attachment.created", "complaint", complaint.id, {"filename": attachment.filename})
    db.commit()
    db.refresh(attachment)
    return attachment


@app.post("/intake/email", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
def intake_email(payload: ComplaintCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    require_role(current, Role.staff, Role.admin)
    complaint = Complaint(id=str(uuid4()), student_id=current.id, department=payload.department, title=payload.title, description=payload.description, priority=payload.priority.value)
    db.add(complaint)
    write_audit(db, current, "intake.email.created", "complaint", complaint.id)
    db.commit()
    db.refresh(complaint)
    enqueue_ai_processing(complaint.id)
    return complaint


@app.post("/intake/pdf", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def intake_pdf(
    department: str,
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
    complaint = Complaint(id=str(uuid4()), student_id=current.id, department=department, title=title, description=f"PDF intake: {file.filename}", priority=Priority.normal.value)
    db.add(complaint)
    db.flush()
    target = settings.upload_path / f"{uuid4()}-{Path(file.filename or 'intake.pdf').name}"
    target.write_bytes(content)
    db.add(Attachment(complaint_id=complaint.id, filename=file.filename or "intake.pdf", content_type="application/pdf", size_bytes=len(content), storage_path=str(target)))
    write_audit(db, current, "intake.pdf.created", "complaint", complaint.id)
    db.commit()
    db.refresh(complaint)
    enqueue_ai_processing(complaint.id)
    return complaint


@app.get("/dashboard/department", response_model=QueueStats)
def department_dashboard(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> QueueStats:
    require_role(current, Role.staff, Role.admin)
    department = current.department or "all"
    query = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status)
    if current.role == Role.staff.value:
        query = query.filter(Complaint.department == current.department)
    stats = QueueStats(department=department)
    for status_name, count in query.all():
        if hasattr(stats, status_name):
            setattr(stats, status_name, count)
    return stats


@app.get("/notifications", response_model=list[NotificationOut])
def list_notifications(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Notification]:
    require_role(current, Role.staff, Role.admin)
    query = db.query(Notification).order_by(Notification.created_at.desc())
    if current.role == Role.staff.value:
        query = query.join(Complaint, Notification.complaint_id == Complaint.id).filter(
            Complaint.department == current.department
        )
    return query.limit(100).all()


@app.post("/admin/sla-check")
def run_sla_check(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current, Role.admin)
    return {"escalated": check_slas(db)}
