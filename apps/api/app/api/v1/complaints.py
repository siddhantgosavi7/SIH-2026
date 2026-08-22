from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.complaints import (
    AssignmentCreate,
    ComplaintCreate,
    ComplaintRead,
    IntakeResponse,
    ResolutionCreate,
    StatusUpdate,
    ValidationCreate,
)
from app.services import complaints as complaint_service

router = APIRouter(tags=["complaints"])


async def _complaint_or_404(session: AsyncSession, complaint_id: str):
    complaint = await complaint_service.get_complaint(session, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.post("/complaints", response_model=IntakeResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(payload: ComplaintCreate, idempotency_key: str | None = Header(default=None), x_student_id: str = Header(default="student-demo"), x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> IntakeResponse:
    complaint = await complaint_service.create_complaint(session, payload, x_student_id, idempotency_key, x_correlation_id or uuid4().hex)
    return IntakeResponse(complaint_id=complaint.id, status=complaint.status, message="Complaint received, classified, and routed for action.")


@router.get("/complaints", response_model=list[ComplaintRead])
async def list_complaints(session: AsyncSession = Depends(get_session)) -> list[ComplaintRead]:
    return [complaint_service.as_read(item) for item in await complaint_service.list_complaints(session)]


@router.get("/departments/{department_id}/queue", response_model=list[ComplaintRead])
async def department_queue(department_id: str, session: AsyncSession = Depends(get_session)) -> list[ComplaintRead]:
    """Return the priority-sorted active projection for one department."""
    return [complaint_service.as_read(item) for item in await complaint_service.list_complaints(session, department_id) if item.status != "closed"]


@router.get("/complaints/{complaint_id}", response_model=ComplaintRead)
async def get_complaint(complaint_id: str, session: AsyncSession = Depends(get_session)) -> ComplaintRead:
    return complaint_service.as_read(await _complaint_or_404(session, complaint_id))


@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintRead)
async def assign_complaint(complaint_id: str, payload: AssignmentCreate, x_actor_id: str = Header(default="staff-demo"), x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> ComplaintRead:
    try:
        return complaint_service.as_read(await complaint_service.assign(session, await _complaint_or_404(session, complaint_id), payload, x_actor_id, x_correlation_id or uuid4().hex))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/status", response_model=ComplaintRead)
async def update_status(complaint_id: str, payload: StatusUpdate, x_actor_id: str = Header(default="staff-demo"), x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> ComplaintRead:
    try:
        return complaint_service.as_read(await complaint_service.transition(session, await _complaint_or_404(session, complaint_id), payload.status, x_actor_id, x_correlation_id or uuid4().hex, payload.reason))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/resolve", response_model=ComplaintRead)
async def resolve_complaint(complaint_id: str, payload: ResolutionCreate, x_actor_id: str = Header(default="staff-demo"), x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> ComplaintRead:
    try:
        return complaint_service.as_read(await complaint_service.resolve(session, await _complaint_or_404(session, complaint_id), payload, x_actor_id, x_correlation_id or uuid4().hex))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/validation", response_model=ComplaintRead)
async def validate_resolution(complaint_id: str, payload: ValidationCreate, x_student_id: str = Header(default="student-demo"), x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> ComplaintRead:
    try:
        return complaint_service.as_read(await complaint_service.validate(session, await _complaint_or_404(session, complaint_id), payload, x_student_id, x_correlation_id or uuid4().hex))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
