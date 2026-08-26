from sqlalchemy.orm import Session

from app.models import DepartmentPolicy

DEFAULT_POLICIES = (
    ("Hostel", "Hostel", ["hostel", "water", "mess", "room", "warden"], 24),
    ("Exam Cell", "Examinations", ["exam", "result", "marks", "hallticket", "timetable"], 24),
    ("Academics", "Academics", ["class", "course", "faculty", "attendance", "syllabus"], 48),
    ("Infrastructure", "Infrastructure", ["electricity", "wifi", "internet", "road", "building"], 48),
)


def ensure_default_policies(db: Session) -> None:
    if db.query(DepartmentPolicy).count():
        return
    db.add_all(
        DepartmentPolicy(name=name, category=category, keywords=keywords, sla_hours=sla_hours)
        for name, category, keywords, sla_hours in DEFAULT_POLICIES
    )
    db.flush()
