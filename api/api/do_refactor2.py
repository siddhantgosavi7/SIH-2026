import re
import os

with open('app/main.py', 'r') as f:
    source = f.read()

common_imports = """
from datetime import timezone
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload
from app.audit import write_audit
from app.core.config import settings
from app.database import get_db
from app.api.dependencies import get_current_user
from app.idempotency import get_existing, request_hash, store_response
from app.pipeline import analyze_complaint
from app.models import Attachment, AuditLog, Comment, Complaint, ComplaintStatus, DepartmentPolicy, Message, Notification, Priority, ProblemGroup, Role, StudentProfile, User, utcnow
from app.rbac import enforce_view_complaint, require_role
from app.schemas import *
from app.core.security import create_access_token, hash_password, verify_password
from app.workers.queue import enqueue_ai_processing
from app.workers.sla_tasks import check_slas
from app.workers.emerging_tasks import check_emerging_clusters
from app.services.intelligent_intake import build_payload
from app.services.problem_grouping import assign_complaint_to_group, recalculate_group, resolve_problem_group
from app.pipeline.priority import apply_priority
from app.pipeline.classifier import classify_complaint
from app.pipeline.policies import ensure_default_policies
from app.core.constants import DEPARTMENTS, ALLOWED_ATTACHMENT_TYPES, TRANSITIONS

# Ensure bootstrap functions are accessible if needed
from app.main_bootstraps import bootstrap_admin, bootstrap_staff, bootstrap_departments
"""

# Split by \n@app.
parts = re.split(r'\n@app\.', '\n' + source)
header = parts[0]
routes = parts[1:]

route_files = {
    "auth.py": [],
    "users.py": [],
    "complaints.py": [],
    "dashboard.py": [],
    "messages.py": [],
    "admin.py": [],
    "health.py": [],
    "student_profiles.py": [],
    "intake.py": [],
    "departments.py": [],
    "comments.py": [],
    "notifications.py": []
}

def determine_file(path, func_name):
    if path.startswith("/auth"): return "auth.py"
    if path.startswith("/users"): return "users.py"
    if path.startswith("/dashboard"): return "dashboard.py"
    if path.startswith("/students/me/dashboard"): return "dashboard.py"
    if path.startswith("/staff/dashboard"): return "dashboard.py"
    if path.startswith("/admin/dashboard"): return "dashboard.py"
    if path.startswith("/students/me/profile"): return "student_profiles.py"
    if path.startswith("/admin/student-profiles"): return "student_profiles.py"
    if path.startswith("/intake"): return "intake.py"
    if path.startswith("/departments") or path.startswith("/admin/departments"): return "departments.py"
    if path.startswith("/notifications"): return "notifications.py"
    if "messages" in path: return "messages.py"
    if "/comments" in path: return "comments.py"
    if path.startswith("/complaints") or path.startswith("/staff/complaints"): return "complaints.py"
    if path.startswith("/admin"): return "admin.py"
    if path.startswith("/health"): return "health.py"
    return "admin.py"

ignored_routes = []

for route in routes:
    if route.startswith("on_event"):
        ignored_routes.append(route)
        continue
        
    full_route = "@router." + route.lstrip()
    match = re.search(r'[\w]+\(\s*"([^"]+)"', full_route)
    if match:
        path = match.group(1)
        func_match = re.search(r'def\s+(\w+)\s*\(', full_route)
        func_name = func_match.group(1) if func_match else ""
        
        file_name = determine_file(path, func_name)
        route_files[file_name].append(full_route)

os.makedirs("app/api/routes", exist_ok=True)
for file_name, funcs in route_files.items():
    if not funcs: continue
    
    tags = [file_name.replace(".py", "")]
    router_init = f'router = APIRouter(tags={tags})\n'
    
    with open(f"app/api/routes/{file_name}", "w") as f:
        f.write(common_imports + "\n\n" + router_init + "\n\n")
        f.write("\n\n".join(funcs))

print("Routes extracted via regex.")
