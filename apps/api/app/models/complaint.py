from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, Timestamped


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)


class User(Base, Timestamped):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"), index=True)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)


class Complaint(Base, Timestamped):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="WEB")
    category: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    subcategory: Mapped[str] = mapped_column(String(64), nullable=False)
    classification_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    priority_score: Mapped[int] = mapped_column(Integer, nullable=False)
    priority_level: Mapped[str] = mapped_column(String(20), nullable=False)
    priority_reasons: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"), index=True)
    assigned_to: Mapped[str | None] = mapped_column(String(100))
    cluster_id: Mapped[str | None] = mapped_column(String(32), index=True)
    related_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sla_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    escalation_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    resolution: Mapped[str | None] = mapped_column(Text)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    audit_events: Mapped[list["ComplaintAuditEvent"]] = relationship(back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintAuditEvent.created_at")


class ComplaintAuditEvent(Base):
    __tablename__ = "complaint_audit_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    complaint: Mapped[Complaint] = relationship(back_populates="audit_events")


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), index=True, nullable=False)
    recipient_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    kind: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id", ondelete="CASCADE"), index=True, nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
