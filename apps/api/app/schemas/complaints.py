"""API contracts for the grievance lifecycle."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.domain import ComplaintStatus, PriorityLevel


class ComplaintCreate(BaseModel):
    text: str = Field(min_length=20, max_length=5000)
    affected_users: int = Field(default=1, ge=1, le=100000)
    source: str = Field(default="WEB", max_length=20)


class StatusUpdate(BaseModel):
    status: ComplaintStatus
    reason: str = Field(min_length=3, max_length=1000)


class AssignmentCreate(BaseModel):
    assignee: str = Field(min_length=2, max_length=100)


class ResolutionCreate(BaseModel):
    resolution: str = Field(min_length=10, max_length=3000)


class ValidationCreate(BaseModel):
    accepted: bool
    comment: str | None = Field(default=None, max_length=1000)


class AuditEvent(BaseModel):
    event_type: str
    actor: str
    created_at: datetime
    payload: dict[str, Any] = Field(default_factory=dict)


class ComplaintRead(BaseModel):
    id: str
    student_id: str
    original_text: str
    category: str
    subcategory: str
    classification_confidence: float
    priority_score: int
    priority_level: PriorityLevel
    priority_reasons: list[str]
    status: ComplaintStatus
    department_id: str | None
    assigned_to: str | None
    cluster_id: str | None
    related_count: int
    sla_due_at: datetime | None
    escalation_level: int = 0
    resolution: str | None = None
    created_at: datetime
    updated_at: datetime
    audit_events: list[AuditEvent] = Field(default_factory=list)


class IntakeResponse(BaseModel):
    complaint_id: str
    status: ComplaintStatus
    message: str


class AnalyticsRead(BaseModel):
    active_backlog: int
    resolved_total: int
    breached_slas: int
    reopen_rate: float
    by_department: dict[str, int]
    by_category: dict[str, int]
    duplicate_clusters: int
