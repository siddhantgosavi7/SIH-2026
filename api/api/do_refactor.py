import ast
import os
import textwrap

with open('app/main.py', 'r') as f:
    source = f.read()

tree = ast.parse(source)

# Extract constants and imports to a common string so we can prepend it to routes
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
"""

# Map routes to files based on path prefix
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
    if path.startswith("/departments"): return "departments.py"
    if path.startswith("/notifications"): return "notifications.py"
    if "messages" in path: return "messages.py"
    if "/comments" in path: return "comments.py"
    if path.startswith("/complaints") or path.startswith("/staff/complaints"): return "complaints.py"
    if path.startswith("/admin"): return "admin.py"
    if path.startswith("/health"): return "health.py"
    
    return "admin.py"  # fallback

functions_to_remove = []

for node in tree.body:
    if isinstance(node, ast.FunctionDef):
        # check decorators
        is_route = False
        route_path = ""
        for dec in node.decorator_list:
            if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                if dec.func.value.id == "app":
                    is_route = True
                    route_path = dec.args[0].value
        
        if is_route:
            functions_to_remove.append(node)
            file_name = determine_file(route_path, node.name)
            func_source = ast.get_source_segment(source, node)
            # replace @app. with @router.
            func_source = func_source.replace("@app.", "@router.")
            route_files[file_name].append(func_source)

# Write out the route files
os.makedirs("app/api/routes", exist_ok=True)
for file_name, funcs in route_files.items():
    if not funcs: continue
    
    # We will use existing routers if they are already in the file, or create them.
    prefix = ""
    tags = []
    if file_name == "auth.py": prefix, tags = "/auth", ["auth"]
    elif file_name == "users.py": prefix, tags = "/users", ["users"]
    elif file_name == "dashboard.py": prefix, tags = "", ["dashboard"]
    elif file_name == "student_profiles.py": prefix, tags = "", ["profiles"]
    elif file_name == "intake.py": prefix, tags = "/intake", ["intake"]
    elif file_name == "departments.py": prefix, tags = "/departments", ["departments"]
    elif file_name == "notifications.py": prefix, tags = "/notifications", ["notifications"]
    elif file_name == "messages.py": prefix, tags = "", ["messages"]
    elif file_name == "comments.py": prefix, tags = "", ["comments"]
    elif file_name == "complaints.py": prefix, tags = "", ["complaints"]
    elif file_name == "admin.py": prefix, tags = "/admin", ["admin"]
    elif file_name == "health.py": prefix, tags = "/health", ["health"]
    
    # For simplicity, we just won't use a router prefix so that the paths match exactly what's in main.py,
    # except we do need APIRouter().
    # Actually, if we keep the paths exactly as they are in the decorators, we should use prefix="", but let's just use prefix="" for all of them so we don't have to strip the prefix from the path.
    
    router_init = f'router = APIRouter(tags={tags})\n'
    
    with open(f"app/api/routes/{file_name}", "w") as f:
        f.write(common_imports + "\n\n" + router_init + "\n\n")
        f.write("\n\n".join(funcs))

print(f"Extracted {len(functions_to_remove)} routes.")
