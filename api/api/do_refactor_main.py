clean_main = """
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import configure_logging
from app.rate_limit import RateLimiter
from app.errors import register_error_handlers
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.routes.alerts import router as alerts_router
from app.api.routes.problem_groups import router as problem_groups_router
from app.api.routes.student_problems import router as student_problems_router
from app.api.routes.public import router as public_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.complaints import router as complaints_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.messages import router as messages_router
from app.api.routes.admin import router as admin_router
from app.api.routes.health import router as health_router
from app.api.routes.student_profiles import router as student_profiles_router
from app.api.routes.intake import router as intake_router
from app.api.routes.departments import router as departments_router
from app.api.routes.comments import router as comments_router
from app.api.routes.notifications import router as notifications_router

configure_logging()
app = FastAPI(title="Grievance Intelligence & Orchestration Platform", version="1.0.0", dependencies=[Depends(RateLimiter())])
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

@app.on_event("startup")
def startup() -> None:
    settings.upload_path.mkdir(parents=True, exist_ok=True)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(student_profiles_router)
app.include_router(departments_router)
app.include_router(intake_router)
app.include_router(complaints_router)
app.include_router(comments_router)
app.include_router(messages_router)
app.include_router(admin_router)
app.include_router(notifications_router)
app.include_router(alerts_router)
app.include_router(problem_groups_router)
app.include_router(student_problems_router)
app.include_router(public_router)
"""

with open('app/main.py', 'w') as f:
    f.write(clean_main)
