from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.complaints import AnalyticsRead
from app.services import complaints as complaint_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics", response_model=AnalyticsRead)
async def analytics(session: AsyncSession = Depends(get_session)) -> AnalyticsRead:
    return await complaint_service.analytics(session)
