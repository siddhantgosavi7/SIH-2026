from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.domain import Role
from app.models.complaint import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.security.auth import hash_password, issue_token, new_user_id, verify_password
from app.services.complaints import now

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    existing = await session.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    timestamp = now()
    user = User(id=new_user_id(), email=payload.email.lower(), name=payload.name, password_hash=hash_password(payload.password), role=Role.STUDENT.value, created_at=timestamp, updated_at=timestamp)
    session.add(user)
    await session.commit()
    return TokenResponse(access_token=issue_token(user))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=issue_token(user))
