from sqlalchemy.orm import Session

from app.models import Complaint
from app.pipeline.classifier import classify_complaint
from app.pipeline.duplicate_detector import detect_duplicates
from app.pipeline.policies import ensure_default_policies
from app.pipeline.priority import apply_priority


def analyze_complaint(db: Session, complaint: Complaint) -> None:
    """Run the synchronous complaint analysis stages before persistence."""
    ensure_default_policies(db)
    text = f"{complaint.title} {complaint.description}"
    text_tokens = classify_complaint(db, complaint)
    apply_priority(complaint, text_tokens)
    detect_duplicates(db, complaint, text)
