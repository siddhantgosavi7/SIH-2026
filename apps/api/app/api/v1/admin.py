from fastapi import APIRouter

from app.schemas.complaints import AnalyticsRead
from app.services.store import store

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics", response_model=AnalyticsRead)
def analytics() -> AnalyticsRead:
    return store.analytics()
