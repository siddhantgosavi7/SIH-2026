from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.session import get_session
from app.domain import Role
from app.main import app
from app.models import Base
from app.models.complaint import Department, User
from app.security.auth import hash_password
from app.services.complaints import now


@pytest.fixture
def client(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    sessions = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_session() -> AsyncIterator[AsyncSession]:
        async with sessions() as session:
            yield session

    async def setup() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with sessions() as session:
            timestamp = now()
            session.add(Department(id="hostel", name="Hostel"))
            session.add(User(id="staff-hostel", email="hostel.sih.demo@gmail.com", name="Hostel Staff", password_hash=hash_password("DemoPass-2026!"), role=Role.DEPARTMENT_STAFF.value, department_id="hostel", created_at=timestamp, updated_at=timestamp))
            await session.commit()

    import asyncio

    asyncio.run(setup())
    app.dependency_overrides[get_session] = override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())


def auth_headers(client: TestClient, email: str, name: str = "Demo Student") -> dict[str, str]:
    response = client.post("/api/v1/auth/register", json={"email": email, "name": name, "password": "StudentPass-2026!"})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def login_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_full_complaint_lifecycle(client: TestClient) -> None:
    student_headers = auth_headers(client, "student1@gmail.com")
    created = client.post(
        "/api/v1/complaints",
        headers={**student_headers, "Idempotency-Key": "water-outage-1"},
        json={"text": "There has been no water in Hostel Block A since today and 80 students are affected.", "affected_users": 80},
    )
    assert created.status_code == 201, created.text
    complaint_id = created.json()["complaint_id"]

    detail = client.get(f"/api/v1/complaints/{complaint_id}", headers=student_headers)
    assert detail.status_code == 200
    assert detail.json()["category"] == "HOSTEL"
    assert detail.json()["department_id"] == "hostel"
    assert detail.json()["priority_score"] >= 60

    staff_headers = login_headers(client, "hostel.sih.demo@gmail.com", "DemoPass-2026!")
    assert client.post(f"/api/v1/complaints/{complaint_id}/assign", headers=staff_headers, json={"assignee": "hostel-staff-1"}).status_code == 200
    assert client.post(f"/api/v1/complaints/{complaint_id}/status", headers=staff_headers, json={"status": "in_progress", "reason": "Maintenance team dispatched"}).status_code == 200
    resolved = client.post(f"/api/v1/complaints/{complaint_id}/resolve", headers=staff_headers, json={"resolution": "Water pump was repaired and supply restored."})
    assert resolved.status_code == 200, resolved.text
    assert resolved.json()["status"] == "validation_pending"

    reopened = client.post(f"/api/v1/complaints/{complaint_id}/validation", headers=student_headers, json={"accepted": False, "comment": "Supply is still intermittent."})
    assert reopened.status_code == 200, reopened.text
    assert reopened.json()["status"] == "reopened"
    assert len(reopened.json()["audit_events"]) >= 7


def test_create_is_idempotent(client: TestClient) -> None:
    headers = auth_headers(client, "student2@gmail.com")
    payload = {"text": "My examination hall ticket is unavailable for tomorrow's exam.", "affected_users": 1}
    first = client.post("/api/v1/complaints", headers={**headers, "Idempotency-Key": "exam-ticket-1"}, json=payload)
    second = client.post("/api/v1/complaints", headers={**headers, "Idempotency-Key": "exam-ticket-1"}, json=payload)
    assert first.status_code == second.status_code == 201
    assert first.json()["complaint_id"] == second.json()["complaint_id"]
    assert len(client.get("/api/v1/complaints", headers=headers).json()) == 1


def test_student_cannot_read_another_students_complaint(client: TestClient) -> None:
    owner_headers = auth_headers(client, "owner@gmail.com", "Owner")
    other_headers = auth_headers(client, "other@gmail.com", "Other")
    created = client.post("/api/v1/complaints", headers=owner_headers, json={"text": "There is no water in Hostel Block B and the problem started this morning.", "affected_users": 30})
    complaint_id = created.json()["complaint_id"]
    assert client.get(f"/api/v1/complaints/{complaint_id}", headers=other_headers).status_code == 403
    assert client.get("/api/v1/admin/analytics", headers=other_headers).status_code == 403


def test_attachment_rejects_unsafe_type(client: TestClient) -> None:
    headers = auth_headers(client, "attachment@gmail.com")
    created = client.post("/api/v1/complaints", headers=headers, json={"text": "Hostel room light is not working since yesterday morning.", "affected_users": 1})
    response = client.post(
        f"/api/v1/intake/complaints/{created.json()['complaint_id']}/attachments",
        headers=headers,
        files={"file": ("unsafe.exe", b"binary", "application/octet-stream")},
    )
    assert response.status_code == 415


def test_submission_rate_limit(client: TestClient) -> None:
    headers = auth_headers(client, "rate.limit@gmail.com")
    for index in range(5):
        response = client.post("/api/v1/complaints", headers=headers, json={"text": f"Hostel room maintenance concern number {index} requires action today.", "affected_users": 1})
        assert response.status_code == 201
    assert client.post("/api/v1/complaints", headers=headers, json={"text": "Hostel room maintenance concern number six requires action today.", "affected_users": 1}).status_code == 429
