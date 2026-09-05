from app.models import ComplaintStatus

DEPARTMENTS = [
    "Hostel",
    "CSE",
    "AIML",
    "CSBS",
    "Mechanical",
    "Electrical",
    "ENTC",
    "Biotech",
    "Exam Cell",
    "Canteen",
    "General Review",
]

ALLOWED_ATTACHMENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "text/plain"}

TRANSITIONS = {
    ComplaintStatus.open.value: {ComplaintStatus.in_progress.value, ComplaintStatus.escalated.value, ComplaintStatus.resolved.value},
    ComplaintStatus.in_progress.value: {ComplaintStatus.resolved.value, ComplaintStatus.escalated.value},
    ComplaintStatus.escalated.value: {ComplaintStatus.in_progress.value, ComplaintStatus.resolved.value},
    ComplaintStatus.resolved.value: {ComplaintStatus.closed.value, ComplaintStatus.in_progress.value},
    ComplaintStatus.closed.value: set(),
}
