from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.complaint import Notification, User
from app.schemas.notifications import NotificationRead
from app.security.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(session: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)) -> list[NotificationRead]:
    statement = select(Notification).where(Notification.recipient_id == user.id).order_by(Notification.created_at.desc())
    return [NotificationRead.model_validate(notification, from_attributes=True) for notification in (await session.execute(statement)).scalars()]
