from app.models import Complaint, Priority
from app.pipeline.priority import apply_priority

def test_priority_safety_risk_highest():
    complaint = Complaint()
    result = apply_priority(complaint, {"unsafe", "medical"})
    assert "safety_risk" in [s["signal"] for s in result["signals"]]
    assert result["score"] >= 30
    assert result["priority"] in (Priority.normal.value, Priority.high.value)

def test_priority_urgency():
    complaint = Complaint()
    result = apply_priority(complaint, {"urgent", "deadline"})
    assert "urgency" in [s["signal"] for s in result["signals"]]
    assert result["score"] >= 25
    
def test_priority_affected_users():
    complaint = Complaint()
    result = apply_priority(complaint, set(), affected_users=60)
    assert "affected_users" in [s["signal"] for s in result["signals"]]
    assert result["score"] >= 20

def test_priority_sla_risk():
    complaint = Complaint()
    result = apply_priority(complaint, set(), sla_hours_remaining=4)
    assert "sla_risk" in [s["signal"] for s in result["signals"]]
    assert result["score"] >= 15

def test_priority_recurrence():
    complaint = Complaint()
    result = apply_priority(complaint, set(), similar_count=6)
    assert "recurrence" in [s["signal"] for s in result["signals"]]
    assert result["score"] >= 10

def test_combined_signals_urgent():
    complaint = Complaint()
    result = apply_priority(
        complaint,
        {"unsafe", "urgent"},
        affected_users=60,
        similar_count=10,
        sla_hours_remaining=2
    )
    # Score should be 30 (safety) + 25 (urgency) + 20 (users) + 15 (SLA) + 10 (recurrence) = 100
    assert result["score"] >= 100
    assert result["priority"] == Priority.urgent.value
    assert len(result["signals"]) == 5
