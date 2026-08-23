import os
from collections.abc import Generator

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-at-least-32-characters")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("UPLOAD_DIR", "test-uploads")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models import Base, Role, User
from app.security import hash_password

engine = create_engine("sqlite+pysqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    session.add_all(
        [
            User(email="student@example.edu", hashed_password=hash_password("password123"), role=Role.student.value, department=None),
            User(email="other@example.edu", hashed_password=hash_password("password123"), role=Role.student.value, department=None),
            User(email="hostel@example.edu", hashed_password=hash_password("password123"), role=Role.staff.value, department="Hostel"),
            User(email="admin@example.edu", hashed_password=hash_password("password123"), role=Role.admin.value, department=None),
        ]
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def token(client: TestClient, email: str) -> str:
    res = client.post("/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]
