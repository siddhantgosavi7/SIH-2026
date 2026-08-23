from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models import ComplaintStatus, Priority, Role


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    department: str | None


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class StudentRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

    model_config = {"extra": "forbid"}


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: Role = Role.student
    department: str | None = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    department: str | None

    model_config = {"from_attributes": True}


class ComplaintCreate(BaseModel):
    title: str = Field(min_length=3, max_length=240)
    description: str = Field(min_length=10)
    affected_users: int = Field(default=1, ge=1, le=100000)


class ComplaintTransition(BaseModel):
    status: ComplaintStatus
    note: str | None = None


class AssignmentRequest(BaseModel):
    user_id: int
    note: str | None = Field(default=None, max_length=500)


class ReopenRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=500)


class ComplaintOut(BaseModel):
    id: str
    student_id: int
    department: str
    category: str
    subcategory: str | None
    classification_confidence: float
    title: str
    description: str
    status: str
    priority: str
    priority_reasons: list[str]
    source: str
    affected_users: int
    assigned_to_id: int | None
    sla_due_at: datetime
    duplicate_of_id: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

    model_config = {"from_attributes": True}


class AttachmentOut(BaseModel):
    id: int
    filename: str
    content_type: str
    size_bytes: int

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    complaint_id: str | None
    channel: str
    recipient: str
    subject: str
    body: str
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class QueueStats(BaseModel):
    department: str
    open: int = 0
    in_progress: int = 0
    escalated: int = 0
    resolved: int = 0


class AuditEventOut(BaseModel):
    id: int
    actor_id: int | None
    action: str
    entity_type: str
    entity_id: str
    event_metadata: dict
    created_at: datetime

    model_config = {"from_attributes": True}
