from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import token, TestingSessionLocal, engine
from app.models import Base, User, StudentProfile, Role
from app.security import hash_password

Base.metadata.create_all(bind=engine)
session = TestingSessionLocal()
u1 = User(email="student@example.edu", username="student", hashed_password=hash_password("password123"), role=Role.student.value)
session.add(u1)
session.commit()
session.add(StudentProfile(user_id=u1.id, full_name="Student", department="CSE", prn_number="123", division="A", roll_no="1"))
session.commit()

with TestClient(app) as client:
    res = client.post("/auth/login", json={"email": "student@example.edu", "password": "password123"})
    if res.status_code != 200:
        print("LOGIN FAILED", res.text)
        exit(1)
    tok = res.json()["access_token"]
    res = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {tok}"},
        json={"department": "Hostel", "title": "Old case", "description": "This complaint breached deadline.", "priority": "normal"},
    )
    print("STATUS:", res.status_code)
    print("TEXT:", res.text)
