from tests.conftest import token


def test_student_can_register_but_cannot_set_a_role(client):
    created = client.post(
        "/auth/register",
        json={"email": "new.student@example.edu", "username": "newstudent", "password": "StudentPass123!"},
    )
    assert created.status_code == 201, created.text
    assert created.json()["role"] == "student"
    assert client.post(
        "/auth/register",
        json={"email": "new.student@example.edu", "username": "newstudent", "password": "StudentPass123!"},
    ).status_code == 409
    assert client.post(
        "/auth/register",
        json={"email": "bad@example.edu", "username": "baduser", "password": "StudentPass123!", "role": "admin"},
    ).status_code == 422


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
        json={"title": "Hostel upload case", "description": "Need attach proof for this hostel complaint."},
    ).json()
    res = client.post(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("bad.exe", b"nope", "application/x-msdownload")},
    )
    assert res.status_code == 415

def test_magic_byte_validation(client):
    student_token = token(client, "student@example.edu")
    complaint = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Magic upload case", "description": "Need attach proof for this magic complaint."},
    ).json()

    # Try to spoof a JPG with an exe payload
    spoofed_exe = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
    res = client.post(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("spoof.jpg", spoofed_exe, "image/jpeg")},
    )
    assert res.status_code == 415
    assert res.json()["error"]["message"] == "content does not match declared type"

    # Try to upload a real JPG
    real_jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00"
    res = client.post(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("real.jpg", real_jpg, "image/jpeg")},
    )
    assert res.status_code == 201

def test_path_traversal_prevention(client):
    student_token = token(client, "student@example.edu")
    complaint = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Path upload case", "description": "Need attach proof for this path complaint."},
    ).json()

    real_jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00"
    res = client.post(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("../../../etc/passwd.jpg", real_jpg, "image/jpeg")},
    )
    # The filename should be sanitized, so it won't be a 400 bad request from traversal block,
    # but instead will just write a safe file name like `___etc_passwd.jpg` or `passwd.jpg`
    assert res.status_code == 201
    
    # Verify the generated filename does not contain traversal paths
    filename = res.json()["filename"]
    assert "../" not in filename
    assert "etc" not in filename # Path().name strips all parent directories, so only passwd.jpg is left


def test_delete_complaint_rbac(client):
    s1_token = token(client, "student@example.edu")
    res = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {s1_token}"},
        json={"title": "Hostel room fan broken", "description": "Please delete me hostel room"}
    )
    complaint_id = res.json()["id"]

    # Student 2 tries to delete (should fail with 404, not 403)
    s2_token = token(client, "other@example.edu")
    assert client.delete(f"/complaints/{complaint_id}", headers={"Authorization": f"Bearer {s2_token}"}).status_code == 404

    # Staff tries to delete (should fail with 403)
    staff_token = token(client, "hostel@example.edu")
    assert client.delete(f"/complaints/{complaint_id}", headers={"Authorization": f"Bearer {staff_token}"}).status_code == 403

    # Student 1 deletes their own (should succeed 204)
    assert client.delete(f"/complaints/{complaint_id}", headers={"Authorization": f"Bearer {s1_token}"}).status_code == 204

def test_rate_limiter(client):
    # Try 121 requests on a lightweight route to test the rate limiter
    for _ in range(120):
        client.get("/public/stats")
    
    # 121st request should be rate limited
    res = client.get("/public/stats")
    assert res.status_code == 429
