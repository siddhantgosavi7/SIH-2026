from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pwdlib import PasswordHash
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_session
from app.domain import Role
from app.models.complaint import User

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)
settings = get_settings()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    return password_hash.verify(password, stored_hash)


def issue_token(user: User) -> str:
    expiry = datetime.now(UTC) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": user.id, "role": user.role, "department_id": user.department_id, "exp": expiry}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), session: AsyncSession = Depends(get_session)) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
    except JWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token", headers={"WWW-Authenticate": "Bearer"}) from error
    user = await session.get(User, user_id)
    if not user or not user.active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    return user


def require_roles(*roles: Role):
    async def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in {role.value for role in roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def new_user_id() -> str:
    return f"USR-{uuid4().hex[:12].upper()}"
