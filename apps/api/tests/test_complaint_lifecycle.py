from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.session import get_session
from app.main import app
from app.models import Base


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

    import asyncio

    asyncio.run(setup())
    app.dependency_overrides[get_session] = override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())


def test_full_complaint_lifecycle(client: TestClient) -> None:
    created = client.post(
        "/api/v1/complaints",
        headers={"Idempotency-Key": "water-outage-1", "X-Student-Id": "student-1"},
        json={"text": "There has been no water in Hostel Block A since today and 80 students are affected.", "affected_users": 80},
    )
    assert created.status_code == 201, created.text
    complaint_id = created.json()["complaint_id"]

    detail = client.get(f"/api/v1/complaints/{complaint_id}")
    assert detail.status_code == 200
    assert detail.json()["category"] == "HOSTEL"
    assert detail.json()["department_id"] == "hostel"
    assert detail.json()["priority_score"] >= 60

    assert client.post(f"/api/v1/complaints/{complaint_id}/assign", json={"assignee": "hostel-staff-1"}).status_code == 200
    assert client.post(f"/api/v1/complaints/{complaint_id}/status", json={"status": "in_progress", "reason": "Maintenance team dispatched"}).status_code == 200
    resolved = client.post(f"/api/v1/complaints/{complaint_id}/resolve", json={"resolution": "Water pump was repaired and supply restored."})
    assert resolved.status_code == 200, resolved.text
    assert resolved.json()["status"] == "validation_pending"

    reopened = client.post(f"/api/v1/complaints/{complaint_id}/validation", json={"accepted": False, "comment": "Supply is still intermittent."})
    assert reopened.status_code == 200, reopened.text
    assert reopened.json()["status"] == "reopened"
    assert len(reopened.json()["audit_events"]) >= 7


def test_create_is_idempotent(client: TestClient) -> None:
    payload = {"text": "My examination hall ticket is unavailable for tomorrow's exam.", "affected_users": 1}
    first = client.post("/api/v1/complaints", headers={"Idempotency-Key": "exam-ticket-1"}, json=payload)
    second = client.post("/api/v1/complaints", headers={"Idempotency-Key": "exam-ticket-1"}, json=payload)
    assert first.status_code == second.status_code == 201
    assert first.json()["complaint_id"] == second.json()["complaint_id"]
    assert len(client.get("/api/v1/complaints").json()) == 1
