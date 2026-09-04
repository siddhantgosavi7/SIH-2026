from app.models import Complaint, Priority
from app.pipeline.priority_signals import SIGNALS


def apply_priority(
    complaint: Complaint, 
    text_tokens: set[str], 
    affected_users: int = 1, 
    similar_count: int = 0, 
    sla_hours_remaining: float | None = None
) -> dict:
    signals = []
    score = 0

    # Signal 1: Safety risk
    safety_terms = {"unsafe", "harassment", "threat", "medical", "violence", "fire", "electrical", "shock"}
    matched_safety = text_tokens & safety_terms
    if matched_safety:
        score += 30
        signals.append({"signal": "safety_risk", "score": 30, "reason": f"Safety terms: {matched_safety}"})

    # Signal 2: Urgency
    urgency_terms = {"exam", "urgent", "deadline", "emergency", "immediate"}
    disruption_terms = {"water", "electricity", "broken", "fee"}
    matched_urgency = text_tokens & urgency_terms
    if matched_urgency:
        score += 25
        signals.append({"signal": "urgency", "score": 25, "reason": f"Urgency terms: {matched_urgency}"})
    elif any(t in disruption_terms for t in text_tokens):
        score += 12
        signals.append({"signal": "urgency", "score": 12, "reason": "Service disruption language"})

    # Signal 3: Affected users
    user_score = 0
    if affected_users >= 50:
        user_score = 20
    elif affected_users >= 10:
        user_score = 12
    elif affected_users >= 5:
        user_score = 6
        
    if user_score:
        score += user_score
        signals.append({"signal": "affected_users", "score": user_score, "reason": f"{affected_users} students affected"})

    # Signal 4: SLA risk
    if sla_hours_remaining is not None and sla_hours_remaining < 6:
        sla_score = 15
        score += sla_score
        signals.append({"signal": "sla_risk", "score": sla_score, "reason": f"SLA deadline in {sla_hours_remaining:.0f} hours"})

    # Signal 5: Recurrence
    if similar_count >= 5:
        rec_score = 10
        score += rec_score
        signals.append({"signal": "recurrence", "score": rec_score, "reason": f"{similar_count} similar complaints previously reported"})

    # Map to priority
    if score < 20:
        priority = Priority.low.value
    elif score < 40:
        priority = Priority.normal.value
    elif score < 70:
        priority = Priority.high.value
    else:
        priority = Priority.urgent.value

    complaint.priority = priority
    complaint.priority_reasons = [s["reason"] for s in signals] or ["Routine complaint with standard impact"]

    return {"score": score, "signals": signals, "priority": priority}

