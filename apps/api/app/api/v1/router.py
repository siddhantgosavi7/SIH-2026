from fastapi import APIRouter

from app.api.v1 import admin, auth, complaints, intake, notifications

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(complaints.router)
api_router.include_router(intake.router)
api_router.include_router(admin.router)
api_router.include_router(notifications.router)
