from datetime import timezone
from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.audit import write_audit
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.idempotency import get_existing, request_hash, store_response
from app.intelligence import analyze_complaint
from app.logging_config import configure_logging
from app.models import Attachment, AuditLog, Comment, Complaint, ComplaintStatus, DepartmentPolicy, Message, Notification, Role, StudentProfile, User, utcnow
from app.rate_limit import RateLimiter
from app.rbac import enforce_view_complaint, require_role
from app.schemas import (
    AttachmentOut,
    AssignmentRequest,
    AuditEventOut,
    CommentCreate,
    CommentOut,
    ComplaintCreate,
    ComplaintOut,
    ComplaintTransition,
    DepartmentOut,
    DepartmentOverview,
    LoginIn,
    MessageCreate,
    MessageOut,
    NotificationOut,
    NudgeRequest,
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

DEPARTMENTS = [
    "Hostel",
    "CSE",
    "AIML",
    "CSBS",
    "Mechanical",
    "Electrical",
    "ENTC",
    "Biotech",
    "Exam Cell",
    "Canteen",
]

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


def bootstrap_staff(db: Session) -> None:
    staff_accounts = [
        ("hostel_staff", "hostel@institution.edu", "Hostel"),
        ("cse_staff", "cse@institution.edu", "CSE"),
        ("aiml_staff", "aiml@institution.edu", "AIML"),
        ("csbs_staff", "csbs@institution.edu", "CSBS"),
        ("mech_staff", "mech@institution.edu", "Mechanical"),
        ("elec_staff", "elec@institution.edu", "Electrical"),
        ("entc_staff", "entc@institution.edu", "ENTC"),
        ("biotech_staff", "biotech@institution.edu", "Biotech"),
        ("exam_staff", "exam@institution.edu", "Exam Cell"),
        ("canteen_staff", "canteen@institution.edu", "Canteen"),
    ]
    for username, email, dept in staff_accounts:
        existing = db.query(User).filter(
            (func.lower(User.username) == username) | (func.lower(User.email) == email)
        ).first()
        if not existing:
            db.add(
                User(
                    email=email,
                    username=username,
                    hashed_password=hash_password("staff@123"),
                    role=Role.staff.value,
                    department=dept,
                )
            )
    db.commit()


def bootstrap_departments(db: Session) -> None:
    for dept in DEPARTMENTS:
        existing = db.query(DepartmentPolicy).filter(DepartmentPolicy.name == dept).first()
        if not existing:
            db.add(DepartmentPolicy(name=dept, category=dept, active=True))
    db.commit()


@app.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)) -> list[dict]:
    bootstrap_departments(db)
    policies = db.query(DepartmentPolicy).filter(DepartmentPolicy.active == True).all()
    if not policies:
        return [{"name": dept, "category": dept, "active": True} for dept in DEPARTMENTS]
    return [{"name": p.name, "category": p.category, "active": p.active} for p in policies]


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

    # Validate department against seeded list
    dept = payload.department or "Hostel"
    if dept not in DEPARTMENTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid department '{payload.department}'. Must be one of: {', '.join(DEPARTMENTS)}"
        )

    body_hash = await request_hash(request)
    if idempotency_key:
        existing = get_existing(db, current, idempotency_key, request.method, request.url.path, body_hash)
        if existing:
            return JSONResponse(status_code=existing.status_code, content=existing.response_json)
    complaint = Complaint(
        id=str(uuid4()),
        student_id=current.id,
        department=dept,
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
def list_complaints(
    department: str | None = None,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[Complaint]:
    query = (
        db.query(Complaint)
        .options(joinedload(Complaint.student).joinedload(User.student_profile))
        .filter(Complaint.deleted_at.is_(None))
        .order_by(Complaint.created_at.desc())
    )
    if current.role == Role.student.value:
        query = query.filter(Complaint.student_id == current.id)
    elif current.role in {Role.staff.value, Role.department_head.value}:
        query = query.filter(Complaint.department == current.department)
    elif current.role == Role.admin.value and department:
        query = query.filter(Complaint.department == department)
    return query.all()


@app.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Complaint:
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.student).joinedload(User.student_profile))
        .filter(Complaint.id == complaint_id)
        .first()
    )
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


@app.get("/admin/departments/overview", response_model=list[DepartmentOverview])
def get_departments_overview(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[DepartmentOverview]:
    require_role(current, Role.admin)
    now = utcnow()
    complaints = db.query(Complaint).filter(Complaint.deleted_at.is_(None)).all()

    dept_stats: dict[str, DepartmentOverview] = {
        dept: DepartmentOverview(department=dept) for dept in DEPARTMENTS
    }

    for c in complaints:
        dept = c.department
        if dept not in dept_stats:
            dept_stats[dept] = DepartmentOverview(department=dept)

        stats = dept_stats[dept]
        stats.total += 1

        if c.status == ComplaintStatus.open.value:
            stats.open += 1
        elif c.status == ComplaintStatus.in_progress.value:
            stats.in_progress += 1
        elif c.status in {ComplaintStatus.resolved.value, ComplaintStatus.closed.value}:
            stats.resolved += 1

        if c.status not in {ComplaintStatus.resolved.value, ComplaintStatus.closed.value} and c.sla_due_at:
            due = c.sla_due_at if c.sla_due_at.tzinfo else c.sla_due_at.replace(tzinfo=timezone.utc)
            if due < now:
                stats.overdue += 1

    return list(dept_stats.values())


@app.post("/admin/complaints/{complaint_id}/nudge")
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


@app.post("/admin/departments/{department_name}/nudge")
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


@app.post("/admin/sla-check")
def run_sla_check(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current, Role.admin)
    return {"escalated": check_slas(db)}


# ── Comment / Message endpoints ──────────────────────────────────────────────

@app.get("/complaints/{complaint_id}/comments", response_model=list[CommentOut])
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


@app.post("/complaints/{complaint_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
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

@app.post("/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
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


@app.get("/messages/inbox", response_model=list[MessageOut])
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


@app.get("/messages/sent", response_model=list[MessageOut])
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


@app.get("/messages/unread-count")
def get_unread_count(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of unread messages."""
    count = db.query(Message).filter(Message.recipient_id == current.id, Message.is_read == False).count()
    return {"unread_count": count}


@app.get("/messages/{message_id}", response_model=MessageOut)
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


@app.patch("/messages/{message_id}/read", response_model=MessageOut)
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
