"""Deterministic, explainable intelligence fallback for offline/demo deployment."""

import re
from datetime import timedelta

from sqlalchemy.orm import Session

from app.models import Complaint, ComplaintRelation, DepartmentPolicy, Priority, utcnow

DEFAULT_POLICIES = (
    ("Hostel", "Hostel", ["hostel", "water", "mess", "room", "warden"], 24),
    ("Exam Cell", "Examinations", ["exam", "result", "marks", "hallticket", "timetable"], 24),
    ("Academics", "Academics", ["class", "course", "faculty", "attendance", "syllabus"], 48),
    ("Infrastructure", "Infrastructure", ["electricity", "wifi", "internet", "road", "building"], 48),
)


def ensure_default_policies(db: Session) -> None:
    if db.query(DepartmentPolicy).count():
        return
    db.add_all(DepartmentPolicy(name=name, category=category, keywords=keywords, sla_hours=sla_hours) for name, category, keywords, sla_hours in DEFAULT_POLICIES)
    db.flush()


def _tokens(text: str) -> set[str]:
    return {word for word in re.findall(r"[a-z0-9]+", text.lower()) if len(word) > 2}


def _similarity(left: str, right: str) -> float:
    left_tokens, right_tokens = _tokens(left), _tokens(right)
    return len(left_tokens & right_tokens) / len(left_tokens | right_tokens) if left_tokens and right_tokens else 0.0


def analyze_complaint(db: Session, complaint: Complaint) -> None:
    ensure_default_policies(db)
    text = f"{complaint.title} {complaint.description}"
    text_tokens = _tokens(text)
    policies = db.query(DepartmentPolicy).filter_by(active=True).all()
    ranked = sorted(((sum(keyword.lower() in text_tokens for keyword in policy.keywords), policy) for policy in policies), key=lambda item: item[0], reverse=True)
    matches, policy = ranked[0] if ranked else (0, None)
    if policy and matches:
        if not complaint.department or complaint.department == "General Review":
            complaint.department = policy.name
        complaint.category = policy.category
        complaint.classification_confidence = round(min(0.95, 0.45 + matches * 0.2), 2)
        complaint.sla_due_at = utcnow() + timedelta(hours=policy.sla_hours)
    else:
        if not complaint.department:
            complaint.department = "General Review"
        complaint.category = "General"
        complaint.classification_confidence = 0.25

    urgent_terms = {"unsafe", "harassment", "threat", "medical", "violence", "fire"}
    high_terms = {"exam", "water", "electricity", "broken", "fee", "urgent"}
    reasons = []
    score = 0
    if text_tokens & urgent_terms:
        score += 3
        reasons.append("safety or immediate-risk terms detected")
    elif text_tokens & high_terms:
        score += 2
        reasons.append("service disruption terms detected")
    if complaint.affected_users >= 50:
        score += 2
        reasons.append(f"reported impact: {complaint.affected_users} people")
    elif complaint.affected_users >= 10:
        score += 1
        reasons.append(f"reported impact: {complaint.affected_users} people")
    complaint.priority = Priority.urgent.value if score >= 3 else Priority.high.value if score >= 2 else Priority.normal.value
    complaint.priority_reasons = reasons or ["routine impact based on submitted information"]

    candidates = db.query(Complaint).filter(Complaint.id != complaint.id, Complaint.department == complaint.department).order_by(Complaint.created_at.desc()).limit(50)
    for candidate in candidates:
        similarity = _similarity(text, f"{candidate.title} {candidate.description}")
        if similarity < 0.35:
            continue
        relation_type = "DUPLICATE" if similarity >= 0.7 else "RELATED"
        relation = ComplaintRelation(source_complaint_id=complaint.id, target_complaint_id=candidate.id, relation_type=relation_type, similarity_score=similarity, explanation=f"shared complaint terms; lexical similarity {similarity:.2f}")
        db.add(relation)
        if relation_type == "DUPLICATE":
            complaint.duplicate_of_id = candidate.id
        break
