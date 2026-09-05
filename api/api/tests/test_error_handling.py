from tests.conftest import token

def test_404_error_envelope(client):
    res = client.get("/this/does/not/exist")
    assert res.status_code == 404
    data = res.json()
    assert "success" in data
    assert data["success"] is False
    assert "error" in data
    assert data["error"]["code"] == "HTTP_404"
    assert "Not Found" in data["error"]["message"]

def test_422_error_envelope(client, db):
    # Missing required fields like title, description
    t = token(client, "student@example.edu")
    response = client.post("/complaints", headers={"Authorization": f"Bearer {t}"}, json={"department": "Hostel"})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
