import enum
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import Text as TextType, TypeDecorator

try:
    from pgvector.sqlalchemy import Vector as PgVector
except Exception:  # pragma: no cover
    PgVector = None


class VectorType(TypeDecorator):
    impl = TextType
    cache_ok = True

    class Comparator(TypeDecorator.Comparator):
        def l2_distance(self, other):
            # TypeDecorator hides pgvector's own comparator, so bind the
            # `<->` operator here or every distance query raises AttributeError.
            return self.op("<->", return_type=Float)(other)

    comparator_factory = Comparator

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PgVector:
            return dialect.type_descriptor(PgVector(1536))
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.JSONB())
        return dialect.type_descriptor(JSON())


class Base(DeclarativeBase):
    pass


class Role(str, enum.Enum):
    student = "student"
    staff = "staff"
    admin = "admin"


class ComplaintStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    escalated = "escalated"


class Priority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def default_sla_due() -> datetime:
    return utcnow() + timedelta(hours=48)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    department: Mapped[str | None] = mapped_column(String(120), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    complaints: Mapped[list["Complaint"]] = relationship(back_populates="student")


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), index=True, default=ComplaintStatus.open.value, nullable=False)
    priority: Mapped[str] = mapped_column(String(32), index=True, default=Priority.normal.value, nullable=False)
    sla_due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_sla_due, index=True, nullable=False)
    duplicate_of_id: Mapped[str | None] = mapped_column(ForeignKey("complaints.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    student: Mapped[User] = relationship(back_populates="complaints", foreign_keys=[student_id])
    attachments: Mapped[list["Attachment"]] = relationship(back_populates="complaint")


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    complaint: Mapped[Complaint] = relationship(back_populates="attachments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("user_id", "key", "method", "path", name="uq_idempotency_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    method: Mapped[str] = mapped_column(String(12), nullable=False)
    path: Mapped[str] = mapped_column(String(255), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    complaint_id: Mapped[str | None] = mapped_column(ForeignKey("complaints.id"), index=True)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ComplaintEmbedding(Base):
    __tablename__ = "complaint_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), unique=True, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(VectorType(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
