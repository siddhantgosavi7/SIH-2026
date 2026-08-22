"""Scheduled SLA escalation job. Enqueue it with RQ every minute in production."""

import asyncio
from datetime import timedelta
from uuid import uuid4

from sqlalchemy import select

from app.db.session import SessionLocal
from app.domain import ACTIVE_STATUSES
from app.models.complaint import Complaint, Notification
from app.services.complaints import audit, now


async def check_due_complaints() -> int:
    current_time = now()
    async with SessionLocal() as session:
        statement = select(Complaint).where(
            Complaint.status.in_([status.value for status in ACTIVE_STATUSES]),
            Complaint.sla_due_at.is_not(None),
            Complaint.sla_due_at <= current_time,
        )
        complaints = list((await session.execute(statement)).scalars())
        for complaint in complaints:
            complaint.escalation_level += 1
            complaint.updated_at = current_time
            correlation_id = f"sla-{uuid4().hex}"
            await audit(session, complaint, "complaint.escalated", "sla-worker", correlation_id, {"level": complaint.escalation_level, "sla_due_at": complaint.sla_due_at.isoformat()})
            session.add(Notification(id=f"NTF-{uuid4().hex[:16].upper()}", complaint_id=complaint.id, recipient_id=complaint.assigned_to or complaint.department_id or "central-admin", kind="sla_breached", payload={"complaint_id": complaint.id, "level": complaint.escalation_level}, created_at=current_time))
            complaint.sla_due_at = current_time + timedelta(hours=1)
        await session.commit()
        return len(complaints)


def run_sla_check() -> int:
    return asyncio.run(check_due_complaints())
