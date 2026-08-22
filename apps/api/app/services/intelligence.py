"""Deterministic, explainable intelligence fallback for the hackathon MVP.

The service boundary intentionally keeps this replaceable by an LLM/embedding provider.
"""

import re
from dataclasses import dataclass

from app.domain import PriorityLevel


@dataclass(frozen=True)
class Classification:
    category: str
    subcategory: str
    confidence: float
    department_id: str | None


TAXONOMY = {
    "HOSTEL": ("hostel", "water", "electricity", "room", "mess", "sanitation", "block"),
    "EXAMS": ("exam", "examination", "hall ticket", "result", "marks", "timetable"),
    "ACADEMICS": ("faculty", "attendance", "course", "lecture", "academic", "hod", "class"),
    "INFRASTRUCTURE": ("wifi", "internet", "laboratory", "lift", "maintenance", "classroom"),
    "FEES_FINANCE": ("fee", "fees", "scholarship", "refund", "payment"),
}
DEPARTMENTS = {"HOSTEL": "hostel", "EXAMS": "exam-cell", "ACADEMICS": "academics"}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def classify(text: str) -> Classification:
    normalized = normalize(text)
    matches = {category: sum(token in normalized for token in tokens) for category, tokens in TAXONOMY.items()}
    category, score = max(matches.items(), key=lambda item: item[1])
    if not score:
        return Classification("OTHER", "MANUAL_REVIEW", 0.42, None)
    matched_tokens = [token for token in TAXONOMY[category] if token in normalized]
    subcategory = matched_tokens[1 if matched_tokens and matched_tokens[0] == category.lower() and len(matched_tokens) > 1 else 0]
    return Classification(category, subcategory.upper().replace(" ", "_"), min(0.68 + score * 0.1, 0.96), DEPARTMENTS.get(category))


def token_similarity(first: str, second: str) -> float:
    a = set(re.findall(r"[a-z]{3,}", normalize(first)))
    b = set(re.findall(r"[a-z]{3,}", normalize(second)))
    return len(a & b) / len(a | b) if a and b else 0.0


def priority(text: str, affected_users: int, related_count: int) -> tuple[int, PriorityLevel, list[str]]:
    normalized = normalize(text)
    safety = any(term in normalized for term in ("fire", "unsafe", "danger", "injury", "security"))
    immediate = any(term in normalized for term in ("urgent", "immediately", "today", "tomorrow", "exam"))
    service = any(term in normalized for term in ("no water", "electricity", "wifi", "food"))
    impact = 90 if safety else 75 if service else 55
    urgency = 90 if safety or immediate else 45
    affected = min(100, 20 + affected_users // 2)
    recurrence = min(100, related_count * 20)
    score = round(0.30 * impact + 0.25 * urgency + 0.20 * affected + 0.15 * 35 + 0.10 * recurrence)
    level = PriorityLevel.CRITICAL if score >= 80 else PriorityLevel.HIGH if score >= 60 else PriorityLevel.MEDIUM if score >= 40 else PriorityLevel.LOW
    reasons = [f"{affected_users} reported affected user(s)"]
    if safety:
        reasons.append("safety signal detected")
    if immediate:
        reasons.append("time-sensitive language detected")
    if related_count:
        reasons.append(f"{related_count} related active complaint(s)")
    return score, level, reasons
