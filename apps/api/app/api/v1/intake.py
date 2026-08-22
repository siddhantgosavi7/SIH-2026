from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.complaints import _complaint_or_404, require_complaint_access
from app.db.session import get_session
from app.domain import Role
from app.models.complaint import User
from app.schemas.complaints import ComplaintRead
from app.schemas.intake import EmailIntake
from app.security.auth import require_roles
from app.services import attachments as attachment_service
from app.services import complaints as complaint_service

router = APIRouter(prefix="/intake", tags=["intake"])


@router.post("/email", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
async def intake_email(payload: EmailIntake, session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.STUDENT))) -> ComplaintRead:
    from app.schemas.complaints import ComplaintCreate

    complaint = await complaint_service.create_complaint(session, ComplaintCreate(text=f"{payload.subject}\n{payload.body}", affected_users=payload.affected_users, source="EMAIL"), user.id, None, "email-intake")
    return complaint_service.as_read(complaint)


@router.post("/complaints/{complaint_id}/attachments", status_code=status.HTTP_201_CREATED)
async def attach_file(complaint_id: str, file: UploadFile = File(...), session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.STUDENT))) -> dict[str, str | int]:
    complaint = await _complaint_or_404(session, complaint_id)
    require_complaint_access(complaint, user)
    attachment = await attachment_service.save_attachment(session, complaint_id, file)
    return {"id": attachment.id, "name": attachment.original_name, "size_bytes": attachment.size_bytes}


@router.post("/document", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
async def intake_document(file: UploadFile = File(...), session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.STUDENT))) -> ComplaintRead:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF documents are supported")
    data = await file.read()
    try:
        text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages).strip()
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Unable to extract text from PDF") from error
    if len(text) < 20:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="PDF does not contain enough extractable text")
    from app.schemas.complaints import ComplaintCreate

    complaint = await complaint_service.create_complaint(session, ComplaintCreate(text=text, source="PDF"), user.id, None, "document-intake")
    return complaint_service.as_read(complaint)
