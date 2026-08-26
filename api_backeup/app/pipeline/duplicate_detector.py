from app.models import Complaint, ComplaintRelation
from app.pipeline.classifier import tokens


def similarity(left: str, right: str) -> float:
    left_tokens, right_tokens = tokens(left), tokens(right)
    return len(left_tokens & right_tokens) / len(left_tokens | right_tokens) if left_tokens and right_tokens else 0.0


def detect_duplicates(db, complaint: Complaint, text: str) -> None:
    candidates = (
        db.query(Complaint)
        .filter(Complaint.id != complaint.id, Complaint.department == complaint.department)
        .order_by(Complaint.created_at.desc())
        .limit(50)
    )
    for candidate in candidates:
        score = similarity(text, f"{candidate.title} {candidate.description}")
        if score < 0.35:
            continue
        relation_type = "DUPLICATE" if score >= 0.7 else "RELATED"
        db.add(
            ComplaintRelation(
                source_complaint_id=complaint.id,
                target_complaint_id=candidate.id,
                relation_type=relation_type,
                similarity_score=score,
                explanation=f"shared complaint terms; lexical similarity {score:.2f}",
            )
        )
        if relation_type == "DUPLICATE":
            complaint.duplicate_of_id = candidate.id
        break
