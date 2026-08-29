import requests

# 1. Login
session = requests.Session()
login_res = session.post("http://localhost:8000/auth/login", json={
    "username": "test_student_llm2", 
    "password": "password"
})
token = login_res.json().get("access_token")

# 2. Submit a complaint
headers = {"Authorization": f"Bearer {token}"}
complaint_data = {
    "title": "Sparking wire in common room",
    "description": "There is a sparking wire hanging from the ceiling in the common room. It's a massive fire hazard."
}

res = session.post("http://localhost:8000/complaints", json=complaint_data, headers=headers)
print("Status Code:", res.status_code)
print("Response:", res.json())
