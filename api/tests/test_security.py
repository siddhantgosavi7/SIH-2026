from tests.conftest import token


def test_student_cannot_access_staff_dashboard(client):
    student_token = token(client, "student@example.edu")
    res = client.get("/dashboard/department", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403


def test_staff_cannot_create_user(client):
    staff_token = token(client, "hostel@example.edu")
    res = client.post(
        "/users",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"email": "new@example.edu", "password": "password123", "role": "student"},
    )
    assert res.status_code == 403


def test_attachment_validation(client):
    student_token = token(client, "student@example.edu")
    complaint = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"department": "Hostel", "title": "Upload case", "description": "Need attach proof for complaint.", "priority": "normal"},
    ).json()
    res = client.post(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("bad.exe", b"nope", "application/x-msdownload")},
    )
    assert res.status_code == 415
