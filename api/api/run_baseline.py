import time
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.models import Base, User, Role, StudentProfile
from app.security import hash_password

engine = create_engine("sqlite+pysqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)
Base.metadata.create_all(bind=engine)
session = TestingSessionLocal()
u1 = User(email="student@example.edu", username="student", hashed_password=hash_password("password123"), role=Role.student.value, profile_completed=True)
u3 = User(email="hostel@example.edu", username="hostel", hashed_password=hash_password("password123"), role=Role.staff.value, department="Hostel", profile_completed=True)
u4 = User(email="admin@example.edu", username="admin", hashed_password=hash_password("password123"), role=Role.admin.value, profile_completed=True)
session.add_all([u1, u3, u4])
session.flush()
session.add(StudentProfile(user_id=u1.id, full_name="Student User", department="Computer Science", prn_number="2425000001", division="A", roll_no="1"))
session.commit()

def override_get_db():
    try:
        yield session
    except Exception:
        session.rollback()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

results = {}

# Test Login
def time_req(method, url, **kwargs):
    start = time.perf_counter()
    r = client.request(method, url, **kwargs)
    end = time.perf_counter()
    return r, (end-start)*1000

# Login times
r, ms = time_req("POST", "/auth/login", json={"username": "student", "password": "password123"})
results["login_student_ms"] = ms
student_token = r.json()["access_token"]

r, ms = time_req("POST", "/auth/login", json={"username": "hostel", "password": "password123"})
results["login_staff_ms"] = ms
staff_token = r.json()["access_token"]

r, ms = time_req("POST", "/auth/login", json={"username": "admin", "password": "password123"})
results["login_admin_ms"] = ms

# Create complaint
payload = {
    "title": "Water leaking in Hostel A",
    "description": "There is a massive water leak in the hallway of Hostel A causing flooding and safety risk.",
    
    
}
r, ms = time_req("POST", "/complaints", json=payload, headers={"Authorization": f"Bearer {student_token}"})
results["create_complaint_ms"] = ms
data = r.json()
complaint_id = data["id"]
results["ai_department"] = data.get("department")
results["ai_category"] = data.get("category")
results["priority"] = data.get("priority")
results["priority_reasons"] = data.get("priority_reasons")
results["problem_group_id"] = data.get("problem_group_id")

# Public stats
r, ms = time_req("GET", "/public/stats")
results["public_stats_ms"] = ms
results["public_stats_success"] = r.status_code == 200

# Staff Resolution
r = client.post(f"/complaints/{complaint_id}/solution", json={"solution_text": "Plumber fixed it"}, headers={"Authorization": f"Bearer {staff_token}"})
results["staff_solution_success"] = r.status_code == 200

print(json.dumps(results, indent=2))
