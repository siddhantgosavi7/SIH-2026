"""Compatibility facade for the retired problem-group implementation.

The active complaint flow now uses :mod:`intelligent_intake` plus the existing
complaint pipeline.  This module is retained so old imports do not crash.
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.services.intelligent_intake import build_payload


@dataclass(frozen=True)
class GroupResult:
    id: str | None
    problem_code: str | None
    department: str
    priority: str
    affected_users: int


class ProblemGroupingService:
    """Backward-compatible adapter; no separate problem-group table is required."""

    def process(self, db: Session, title: str, description: str) -> GroupResult:
        payload = build_payload(db, title, description)
        return GroupResult(
            id=None,
            problem_code=None,
            department=payload.department,
            priority="normal",
            affected_users=payload.affected_users,
        )
