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
from app.intelligence import analyze_complaint
from app.logging_config import configure_logging
from app.models import Attachment, AuditLog, Complaint, ComplaintStatus, Notification, Role, StudentProfile, User, utcnow
from app.rate_limit import RateLimiter
from app.rbac import enforce_view_complaint, require_role
from app.schemas import (
    AttachmentOut,
    AssignmentRequest,
    AuditEventOut,
    ComplaintCreate,
    ComplaintOut,
    ComplaintTransition,
    LoginIn,
    NotificationOut,
    QueueStats,
    ReopenRequest,
    StudentProfileIn,
    StudentProfileOut,
    StudentProfileAdminOut,
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
app = FastAPI(title="Grievance Intelligence & Orchestration Platform", version="1.0.0", dependencies=[Depends(RateLimiter())])
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
    existing = db.query(User).filter(
        (func.lower(User.email) == settings.admin_email.lower()) | (func.lower(User.username) == "admin")
    ).first()
    if not existing:
        db.add(
            User(
                email=settings.admin_email.lower(),
                username="admin",
                hashed_password=hash_password(settings.admin_password),
                role=Role.admin.value,
                department=None,
            )
        )
        db.commit()
    elif not existing.username:
        existing.username = "admin"
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
    return TokenOut(access_token=token, role=user.role, email=user.email, username=user.username, department=user.department)


@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
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
        department=None,
    )
    db.add(user)
    db.flush()
    write_audit(db, None, "student.registered", "user", str(user.id), {"email": user.email, "username": user.username})
    db.commit()
    db.refresh(user)
    return user


@app.get("/users", response_model=list[UserOut])
def list_users(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[User]:
    require_role(current, Role.admin)
    return db.query(User).order_by(User.created_at.desc()).all()


@app.get("/admin/audit-logs", response_model=list[AuditEventOut])
def list_audit_logs(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[AuditLog]:
    require_role(current, Role.admin)
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()


# ─── Student Profile Endpoints ────────────────────────────────────────────────

@app.get("/students/me/profile", response_model=StudentProfileOut)
def get_my_profile(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> StudentProfile:
    """Get the authenticated student's own academic profile."""
    require_role(current, Role.student)
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current.id).one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="No academic profile found. Please fill in your details.")
    return profile


@app.put("/students/me/profile", response_model=StudentProfileOut)
def upsert_my_profile(
    payload: StudentProfileIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentProfile:
    """Create or update the authenticated student's academic profile."""
    require_role(current, Role.student)

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

    db.flush()
    write_audit(db, current, "student.profile.upsert", "student_profile", str(current.id), {"prn": payload.prn_number})
    db.commit()
    db.refresh(profile)
    return profile


@app.get("/admin/student-profiles", response_model=list[StudentProfileAdminOut])
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


@app.get("/admin/student-profiles/{user_id}", response_model=StudentProfileAdminOut)
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


@app.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    require_role(current, Role.admin)
    if payload.role in {Role.staff, Role.department_head} and not payload.department:
        raise HTTPException(status_code=400, detail="department staff and heads must have a department")
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
        department=payload.department or "General Review",
        title=payload.title,
        description=payload.description,
        priority=payload.priority.value,
        affected_users=payload.affected_users,
    )
    db.add(complaint)
    db.flush()
    analyze_complaint(db, complaint)
    write_audit(db, current, "complaint.created", "complaint", complaint.id, {"department": complaint.department, "category": complaint.category, "priority": complaint.priority})
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
    query = db.query(Complaint).filter(Complaint.deleted_at.is_(None)).order_by(Complaint.created_at.desc())
    if current.role == Role.student.value:
        query = query.filter(Complaint.student_id == current.id)
    elif current.role in {Role.staff.value, Role.department_head.value}:
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
    require_role(current, Role.staff, Role.department_head, Role.admin)
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


@app.post("/complaints/{complaint_id}/assign", response_model=ComplaintOut)
def assign_complaint(complaint_id: str, payload: AssignmentRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    require_role(current, Role.staff, Role.department_head, Role.admin)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    assignee = db.get(User, payload.user_id)
    if not assignee or assignee.role not in {Role.staff.value, Role.department_head.value} or assignee.department != complaint.department:
        raise HTTPException(status_code=400, detail="assignee must be staff in the complaint department")
    complaint.assigned_to_id = assignee.id
    write_audit(db, current, "complaint.assigned", "complaint", complaint.id, {"assignee_id": assignee.id, "note": payload.note})
    db.commit()
    db.refresh(complaint)
    return complaint


@app.post("/complaints/{complaint_id}/reopen", response_model=ComplaintOut)
def reopen_complaint(complaint_id: str, payload: ReopenRequest, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    require_role(current, Role.student)
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if complaint.status not in {ComplaintStatus.resolved.value, ComplaintStatus.closed.value}:
        raise HTTPException(status_code=409, detail="only resolved complaints can be reopened")
    complaint.status = ComplaintStatus.in_progress.value
    write_audit(db, current, "complaint.reopened", "complaint", complaint.id, {"reason": payload.reason})
    db.commit()
    db.refresh(complaint)
    return complaint


@app.get("/complaints/{complaint_id}/timeline", response_model=list[AuditEventOut])
def complaint_timeline(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[AuditLog]:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    return db.query(AuditLog).filter_by(entity_type="complaint", entity_id=complaint_id).order_by(AuditLog.created_at).all()


@app.delete("/complaints/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(
    complaint_id: str,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="complaint not found")
    enforce_view_complaint(current, complaint)
    if complaint.deleted_at is not None:
        raise HTTPException(status_code=404, detail="complaint already deleted")
    complaint.deleted_at = utcnow()
    write_audit(db, current, "complaint.deleted", "complaint", complaint.id, {"title": complaint.title, "department": complaint.department, "status": complaint.status})
    db.commit()


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
    complaint = Complaint(id=str(uuid4()), student_id=current.id, department="General Review", title=payload.title, description=payload.description, affected_users=payload.affected_users, source="email")
    db.add(complaint)
    db.flush()
    analyze_complaint(db, complaint)
    write_audit(db, current, "intake.email.created", "complaint", complaint.id)
    db.commit()
    db.refresh(complaint)
    enqueue_ai_processing(complaint.id)
    return complaint


@app.post("/intake/pdf", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
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
    complaint = Complaint(id=str(uuid4()), student_id=current.id, department="General Review", title=title, description=f"PDF intake: {file.filename}", source="pdf")
    db.add(complaint)
    db.flush()
    analyze_complaint(db, complaint)
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


@app.get("/notifications", response_model=list[NotificationOut])
def list_notifications(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Notification]:
    require_role(current, Role.staff, Role.department_head, Role.admin)
    query = db.query(Notification).order_by(Notification.created_at.desc())
    if current.role in {Role.staff.value, Role.department_head.value}:
        query = query.join(Complaint, Notification.complaint_id == Complaint.id).filter(
            Complaint.department == current.department
        )
    return query.limit(100).all()


@app.post("/admin/sla-check")
def run_sla_check(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current, Role.admin)
    return {"escalated": check_slas(db)}
