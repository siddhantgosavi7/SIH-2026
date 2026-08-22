"""Core grievance domain types and lifecycle rules."""

from enum import StrEnum


class Role(StrEnum):
    STUDENT = "student"
    DEPARTMENT_STAFF = "department_staff"
    DEPARTMENT_HEAD = "department_head"
    CENTRAL_ADMIN = "central_admin"


class ComplaintStatus(StrEnum):
    PROCESSING = "processing"
    REVIEW_REQUIRED = "review_required"
    ROUTED = "routed"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    WAITING_FOR_STUDENT = "waiting_for_student"
    RESOLVED = "resolved"
    VALIDATION_PENDING = "validation_pending"
    CLOSED = "closed"
    REOPENED = "reopened"


class PriorityLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


ACTIVE_STATUSES = {
    ComplaintStatus.PROCESSING,
    ComplaintStatus.REVIEW_REQUIRED,
    ComplaintStatus.ROUTED,
    ComplaintStatus.ASSIGNED,
    ComplaintStatus.IN_PROGRESS,
    ComplaintStatus.WAITING_FOR_STUDENT,
    ComplaintStatus.REOPENED,
}

ALLOWED_TRANSITIONS: dict[ComplaintStatus, set[ComplaintStatus]] = {
    ComplaintStatus.PROCESSING: {ComplaintStatus.REVIEW_REQUIRED, ComplaintStatus.ROUTED},
    ComplaintStatus.REVIEW_REQUIRED: {ComplaintStatus.ROUTED},
    ComplaintStatus.ROUTED: {ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.ASSIGNED: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.WAITING_FOR_STUDENT},
    ComplaintStatus.IN_PROGRESS: {ComplaintStatus.WAITING_FOR_STUDENT, ComplaintStatus.RESOLVED},
    ComplaintStatus.WAITING_FOR_STUDENT: {ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED},
    ComplaintStatus.RESOLVED: {ComplaintStatus.VALIDATION_PENDING},
    ComplaintStatus.VALIDATION_PENDING: {ComplaintStatus.CLOSED, ComplaintStatus.REOPENED},
    ComplaintStatus.REOPENED: {ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS},
    ComplaintStatus.CLOSED: set(),
}
