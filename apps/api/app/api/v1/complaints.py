from fastapi import APIRouter, Header, HTTPException, status

from app.schemas.complaints import AssignmentCreate, ComplaintCreate, ComplaintRead, IntakeResponse, ResolutionCreate, StatusUpdate, ValidationCreate
from app.services.store import store

router = APIRouter(tags=["complaints"])


def _complaint_or_404(complaint_id: str) -> ComplaintRead:
    complaint = store.get(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.post("/complaints", response_model=IntakeResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreate, idempotency_key: str | None = Header(default=None), x_student_id: str = Header(default="student-demo")) -> IntakeResponse:
    complaint = store.create(payload, x_student_id, idempotency_key)
    return IntakeResponse(complaint_id=complaint.id, status=complaint.status, message="Complaint received, classified, and routed for action.")


@router.get("/complaints", response_model=list[ComplaintRead])
def list_complaints() -> list[ComplaintRead]:
    return store.list()


@router.get("/departments/{department_id}/queue", response_model=list[ComplaintRead])
def department_queue(department_id: str) -> list[ComplaintRead]:
    """Return the priority-sorted active projection for one department."""
    return [item for item in store.list(department_id) if item.status.value not in {"closed"}]


@router.get("/complaints/{complaint_id}", response_model=ComplaintRead)
def get_complaint(complaint_id: str) -> ComplaintRead:
    return _complaint_or_404(complaint_id)


@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintRead)
def assign_complaint(complaint_id: str, payload: AssignmentCreate, x_actor_id: str = Header(default="staff-demo")) -> ComplaintRead:
    try:
        return store.assign(_complaint_or_404(complaint_id), payload.assignee, x_actor_id)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/status", response_model=ComplaintRead)
def update_status(complaint_id: str, payload: StatusUpdate, x_actor_id: str = Header(default="staff-demo")) -> ComplaintRead:
    try:
        return store.transition(_complaint_or_404(complaint_id), payload.status, x_actor_id, payload.reason)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/resolve", response_model=ComplaintRead)
def resolve_complaint(complaint_id: str, payload: ResolutionCreate, x_actor_id: str = Header(default="staff-demo")) -> ComplaintRead:
    try:
        return store.resolve(_complaint_or_404(complaint_id), payload.resolution, x_actor_id)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/complaints/{complaint_id}/validation", response_model=ComplaintRead)
def validate_resolution(complaint_id: str, payload: ValidationCreate, x_student_id: str = Header(default="student-demo")) -> ComplaintRead:
    try:
        return store.validate(_complaint_or_404(complaint_id), payload.accepted, x_student_id, payload.comment)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
