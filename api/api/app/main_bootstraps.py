from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models import User, Role
from app.core.config import settings
from app.core.security import hash_password
from app.pipeline.policies import ensure_default_policies

def bootstrap_admin(db: Session) -> None:
    if not settings.admin_email or not settings.admin_password:
        return
    existing = db.query(User).filter(
        (func.lower(User.email) == settings.admin_email.lower()) | (func.lower(User.username) == "admin")
    ).first()
    if not existing:
        db.add(
            User(
                email=settings.admin_email.lower(),
                username="admin",
                hashed_password=hash_password(settings.admin_password),
                role=Role.admin.value,
                department=None,
                profile_completed=True,
            )
        )
        db.commit()
    elif not existing.username:
        existing.username = "admin"
        db.commit()


def bootstrap_staff(db: Session) -> None:
    staff_accounts = [
        ("hostel_staff", "hostel@institution.edu", "Hostel"),
        ("cse_staff", "cse@institution.edu", "CSE"),
        ("aiml_staff", "aiml@institution.edu", "AIML"),
        ("csbs_staff", "csbs@institution.edu", "CSBS"),
        ("mech_staff", "mech@institution.edu", "Mechanical"),
        ("elec_staff", "elec@institution.edu", "Electrical"),
        ("entc_staff", "entc@institution.edu", "ENTC"),
        ("biotech_staff", "biotech@institution.edu", "Biotech"),
        ("exam_staff", "exam@institution.edu", "Exam Cell"),
        ("canteen_staff", "canteen@institution.edu", "Canteen"),
    ]
    for username, email, dept in staff_accounts:
        existing = db.query(User).filter(
            (func.lower(User.username) == username) | (func.lower(User.email) == email)
        ).first()
        if not existing:
            db.add(
                User(
                    email=email,
                    username=username,
                    hashed_password=hash_password("staff@123"),
                    role=Role.staff.value,
                    department=dept,
                    profile_completed=True,
                )
            )
    db.commit()


def bootstrap_departments(db: Session) -> None:
    # Delegate to ensure_default_policies so that keywords and sla_hours
    # are seeded correctly from the canonical DEFAULT_POLICIES list.
    ensure_default_policies(db)
    db.commit()
