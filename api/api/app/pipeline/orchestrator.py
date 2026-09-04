from sqlalchemy.orm import Session
from datetime import timedelta
import time

from app.logger import get_complaint_logger
from app.models import Complaint, DepartmentPolicy, utcnow
from app.pipeline.classifier import classify_complaint, tokens
from app.pipeline.duplicate_detector import detect_duplicates
from app.pipeline.policies import ensure_default_policies
from app.pipeline.priority import apply_priority

logger = get_complaint_logger("api.orchestrator")


def analyze_complaint(db: Session, complaint: Complaint) -> None:
    """Run the synchronous complaint analysis stages before persistence."""
    start_time = time.time()
    ensure_default_policies(db)
    text = f"{complaint.title} {complaint.description}"
    
    if not complaint.category:
        text_tokens = classify_complaint(db, complaint)
        logger.info(
            "Complaint classified",
            extra={
                "complaint_id": complaint.id,
                "department": complaint.department,
                "classification_source": complaint.classification_source,
                "processing_time_ms": round((time.time() - start_time) * 1000, 2)
            }
        )
    else:
        text_tokens = tokens(text)

    # Always apply department-specific SLA — the column default (48h) is only
    # a fallback for DB integrity; the pipeline owns the authoritative value.
    policy = db.query(DepartmentPolicy).filter_by(name=complaint.department).first()
    sla_hours = policy.sla_hours if policy else 48
    complaint.sla_due_at = utcnow() + timedelta(hours=sla_hours)

    # Calculate remaining SLA hours
    remaining_delta = complaint.sla_due_at - utcnow()
    sla_hours_remaining = remaining_delta.total_seconds() / 3600.0

    # Determine similar complaints count synchronously to feed priority (used as a fallback proxy for recurrence)
    # The true problem group logic happens later, but this gives a quick heuristic.
    detect_duplicates(db, complaint, text)
    similar_count = len(getattr(complaint, '_similar_ids', []))

    # Apply priority using the new signal engine
    apply_priority(
        complaint=complaint,
        text_tokens=text_tokens,
        affected_users=complaint.affected_users,
        similar_count=similar_count,
        sla_hours_remaining=sla_hours_remaining,
    )
    
    logger.info(
        "Priority assigned",
        extra={
            "complaint_id": complaint.id,
            "department": complaint.department,
            "priority": complaint.priority,
            "processing_time_ms": round((time.time() - start_time) * 1000, 2)
        }
    )
