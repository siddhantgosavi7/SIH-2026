from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.domain import Role
from app.models.complaint import Complaint, User
from app.schemas.complaints import (
    AssignmentCreate,
    ComplaintCreate,
    ComplaintRead,
    IntakeResponse,
    ResolutionCreate,
    StatusUpdate,
    ValidationCreate,
)
from app.security.auth import get_current_user, require_roles
from app.services import complaints as complaint_service

router = APIRouter(tags=["complaints"])


async def _complaint_or_404(session: AsyncSession, complaint_id: str):
    complaint = await complaint_service.get_complaint(session, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


def require_complaint_access(complaint: Complaint, user: User, *, staff_write: bool = False) -> None:
    if user.role == Role.CENTRAL_ADMIN.value:
        return
    if user.role == Role.STUDENT.value and complaint.student_id == user.id and not staff_write:
        return
    if user.role in {Role.DEPARTMENT_STAFF.value, Role.DEPARTMENT_HEAD.value} and complaint.department_id == user.department_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to access this complaint")


@router.post("/complaints", response_model=IntakeResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(payload: ComplaintCreate, idempotency_key: str | None = Header(default=None), x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.STUDENT))) -> IntakeResponse:
    try:
        complaint = await complaint_service.create_complaint(session, payload, user.id, idempotency_key, x_correlation_id or uuid4().hex)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(error)) from error
    return IntakeResponse(complaint_id=complaint.id, status=complaint.status, message="Complaint received, classified, and routed for action.")


@router.get("/complaints", response_model=list[ComplaintRead])
async def list_complaints(session: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)) -> list[ComplaintRead]:
    items = await complaint_service.list_complaints(session)
    if user.role == Role.STUDENT.value:
        items = [item for item in items if item.student_id == user.id]
    elif user.role in {Role.DEPARTMENT_STAFF.value, Role.DEPARTMENT_HEAD.value}:
        items = [item for item in items if item.department_id == user.department_id]
    return [complaint_service.as_read(item) for item in items]


@router.get("/departments/{department_id}/queue", response_model=list[ComplaintRead])
async def department_queue(department_id: str, session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HEAD, Role.CENTRAL_ADMIN))) -> list[ComplaintRead]:
    """Return the priority-sorted active projection for one department."""
    if user.role != Role.CENTRAL_ADMIN.value and user.department_id != department_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized for this department queue")
    return [complaint_service.as_read(item) for item in await complaint_service.list_complaints(session, department_id) if item.status != "closed"]


@router.get("/complaints/{complaint_id}", response_model=ComplaintRead)
async def get_complaint(complaint_id: str, session: AsyncSession = Depends(get_session), user: User = Depends(get_current_user)) -> ComplaintRead:
    complaint = await _complaint_or_404(session, complaint_id)
    require_complaint_access(complaint, user)
    return complaint_service.as_read(complaint)


@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintRead)
async def assign_complaint(complaint_id: str, payload: AssignmentCreate, x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HEAD, Role.CENTRAL_ADMIN))) -> ComplaintRead:
    try:
        complaint = await _complaint_or_404(session, complaint_id)
        require_complaint_access(complaint, user, staff_write=True)
        return complaint_service.as_read(await complaint_service.assign(session, complaint, payload, user.id, x_correlation_id or uuid4().hex))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/status", response_model=ComplaintRead)
async def update_status(complaint_id: str, payload: StatusUpdate, x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HEAD, Role.CENTRAL_ADMIN))) -> ComplaintRead:
    try:
        complaint = await _complaint_or_404(session, complaint_id)
        require_complaint_access(complaint, user, staff_write=True)
        return complaint_service.as_read(await complaint_service.transition(session, complaint, payload.status, user.id, x_correlation_id or uuid4().hex, payload.reason))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/resolve", response_model=ComplaintRead)
async def resolve_complaint(complaint_id: str, payload: ResolutionCreate, x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HEAD, Role.CENTRAL_ADMIN))) -> ComplaintRead:
    try:
        complaint = await _complaint_or_404(session, complaint_id)
        require_complaint_access(complaint, user, staff_write=True)
        return complaint_service.as_read(await complaint_service.resolve(session, complaint, payload, user.id, x_correlation_id or uuid4().hex))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/validation", response_model=ComplaintRead)
async def validate_resolution(complaint_id: str, payload: ValidationCreate, x_correlation_id: str | None = Header(default=None), session: AsyncSession = Depends(get_session), user: User = Depends(require_roles(Role.STUDENT))) -> ComplaintRead:
    try:
        complaint = await _complaint_or_404(session, complaint_id)
        require_complaint_access(complaint, user)
        return complaint_service.as_read(await complaint_service.validate(session, complaint, payload, user.id, x_correlation_id or uuid4().hex))
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
