import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from functools import lru_cache

from rq import Queue
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import redis

from app.config import settings
from app.models import Complaint, ComplaintEmbedding, ComplaintStatus, Notification


def get_queue() -> Queue:
    conn = redis.from_url(settings.redis_url)
    return Queue("complaints", connection=conn)


def enqueue_ai_processing(complaint_id: str) -> None:
    try:
        get_queue().enqueue("app.tasks.process_ai", complaint_id, job_timeout=120)
    except Exception:
        pass


def enqueue_sla_check() -> None:
    get_queue().enqueue("app.tasks.check_slas", job_timeout=120)


@lru_cache
def _session_factory():
    # Cached: a fresh engine per job would leak a connection pool on every
    # queued task and every SLA tick in the long-running worker process.
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)


def _session():
    return _session_factory()()


def _deterministic_embedding(text: str) -> list[float]:
    seed = sum(ord(ch) for ch in text) or 1
    return [((seed + i * 31) % 997) / 997 for i in range(1536)]


def process_ai(complaint_id: str) -> None:
    db = _session()
    try:
        complaint = db.get(Complaint, complaint_id)
        if not complaint:
            return
        text = f"{complaint.title} {complaint.description}".lower()
        embedding = _deterministic_embedding(text)
        if db.bind and db.bind.dialect.name == "postgresql":
            distance = ComplaintEmbedding.embedding.l2_distance(embedding).label("distance")
            nearest = (
                db.query(ComplaintEmbedding, distance)
                .filter(ComplaintEmbedding.complaint_id != complaint.id)
                .order_by(distance)
                .first()
            )
            if nearest and nearest.distance < 0.15:
                complaint.duplicate_of_id = nearest.ComplaintEmbedding.complaint_id
        if not db.query(ComplaintEmbedding).filter_by(complaint_id=complaint.id).one_or_none():
            db.add(ComplaintEmbedding(complaint_id=complaint.id, embedding=embedding))
        db.commit()
    finally:
        db.close()


def deliver(notification: Notification) -> bool:
    """Send one notification over SMTP. Returns False when SMTP is not configured."""
    if not settings.smtp_host or not settings.smtp_from:
        logging.info("smtp not configured, notification %s stored only", notification.id)
        return False
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = notification.recipient
    message["Subject"] = notification.subject
    message.set_content(notification.body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)
    return True


def check_slas(db=None) -> int:
    owns_session = db is None
    db = db or _session()
    escalated = 0
    try:
        now = datetime.now(timezone.utc)
        complaints = (
            db.query(Complaint)
            .filter(Complaint.sla_due_at <= now)
            .filter(Complaint.status.in_([ComplaintStatus.open.value, ComplaintStatus.in_progress.value]))
            .all()
        )
        pending = []
        for complaint in complaints:
            complaint.status = ComplaintStatus.escalated.value
            notification = Notification(
                complaint_id=complaint.id,
                channel="email",
                recipient=f"{complaint.department.lower()}-head@example.edu",
                subject=f"SLA escalated: {complaint.title}",
                body=f"Complaint {complaint.id} breached SLA and needs action.",
            )
            db.add(notification)
            pending.append(notification)
            escalated += 1
        db.commit()
        for notification in pending:
            try:
                if deliver(notification):
                    notification.sent_at = datetime.now(timezone.utc)
            except Exception:
                logging.exception("failed to deliver notification %s", notification.id)
        db.commit()
        return escalated
    finally:
        if owns_session:
            db.close()
