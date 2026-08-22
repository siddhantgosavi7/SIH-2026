"""Repeatable synthetic-data seed for the controlled demo environment."""

import asyncio

from sqlalchemy import select

from app.db.session import SessionLocal
from app.domain import Role
from app.models.complaint import Department, User
from app.security.auth import hash_password
from app.services.complaints import DEPARTMENTS, now

DEMO_PASSWORD = "DemoPass-2026!"
DEMO_USERS = (
    ("USR-DEMO-ADMIN", "admin.sih.demo@gmail.com", "Central Admin", Role.CENTRAL_ADMIN, None),
    ("USR-DEMO-HOSTEL", "hostel.sih.demo@gmail.com", "Hostel Staff", Role.DEPARTMENT_STAFF, "hostel"),
    ("USR-DEMO-EXAMS", "exams.sih.demo@gmail.com", "Exam Cell Staff", Role.DEPARTMENT_STAFF, "exam-cell"),
    ("USR-DEMO-ACADEMICS", "academics.sih.demo@gmail.com", "Academics Staff", Role.DEPARTMENT_STAFF, "academics"),
)


async def seed() -> None:
    async with SessionLocal() as session:
        for department_id, name in DEPARTMENTS:
            if not await session.get(Department, department_id):
                session.add(Department(id=department_id, name=name))
        for user_id, email, name, role, department_id in DEMO_USERS:
            existing = await session.scalar(select(User).where(User.email == email))
            if not existing:
                timestamp = now()
                session.add(User(id=user_id, email=email, name=name, password_hash=hash_password(DEMO_PASSWORD), role=role.value, department_id=department_id, created_at=timestamp, updated_at=timestamp))
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
