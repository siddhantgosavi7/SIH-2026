from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.complaint import Attachment
from app.services.complaints import now

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "text/plain"}


async def save_attachment(session: AsyncSession, complaint_id: str, upload: UploadFile) -> Attachment:
    if upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported attachment type")
    data = await upload.read()
    settings = get_settings()
    if not data or len(data) > settings.max_attachment_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Attachment exceeds size limit")
    attachment_id = f"ATT-{uuid4().hex[:16].upper()}"
    suffix = Path(upload.filename or "attachment").suffix.lower()
    storage_key = f"{complaint_id}/{attachment_id}{suffix}"
    destination = Path(settings.upload_dir).resolve() / storage_key
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    attachment = Attachment(id=attachment_id, complaint_id=complaint_id, original_name=Path(upload.filename or "attachment").name, storage_key=storage_key, mime_type=upload.content_type, size_bytes=len(data), created_at=now())
    session.add(attachment)
    await session.commit()
    return attachment
