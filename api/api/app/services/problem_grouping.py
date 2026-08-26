from dataclasses import dataclass
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import ProblemGroup
from app.services.department_classifier import predict_department
from app.services.embedding_service import embed, cosine_similarity


SIMILARITY_THRESHOLD = 0.84


@dataclass
class GroupResult:
    id: str
    problem_code: str
    department: str
    priority: str


class ProblemGroupingService:

    def _priority(self, count: int) -> str:
        if count >= 40:
            return "CRITICAL"
        if count >= 15:
            return "HIGH"
        if count >= 5:
            return "MEDIUM"
        return "LOW"

    def process(self, db: Session, title: str, description: str) -> GroupResult:

        text = f"{title}. {description}"

        department = predict_department(text)
        vector = embed(text)

        groups = (
            db.query(ProblemGroup)
            .filter(ProblemGroup.department == department)
            .all()
        )

        best_group = None
        best_score = 0.0

        for group in groups:
            if group.embedding:
                score = cosine_similarity(vector, group.embedding)
                if score > best_score:
                    best_score = score
                    best_group = group

        if best_group and best_score >= SIMILARITY_THRESHOLD:
            best_group.complaint_count += 1
            best_group.priority = self._priority(best_group.complaint_count)

            db.commit()
            db.refresh(best_group)

            return GroupResult(
                id=best_group.id,
                problem_code=best_group.problem_code,
                department=best_group.department,
                priority=best_group.priority,
            )

        code = f"PROB-{str(uuid4())[:8].upper()}"

        new_group = ProblemGroup(
            id=str(uuid4()),
            problem_code=code,
            title=title,
            department=department,
            embedding=vector.tolist(),
            complaint_count=1,
            priority="LOW",
            status="OPEN",
        )

        db.add(new_group)
        db.commit()
        db.refresh(new_group)

        return GroupResult(
            id=new_group.id,
            problem_code=new_group.problem_code,
            department=new_group.department,
            priority=new_group.priority,
        )