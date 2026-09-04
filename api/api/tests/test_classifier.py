from app.models import Complaint, DepartmentPolicy
from app.pipeline.classifier import classify_complaint, tokens


def test_classifier_tokens():
    res = tokens("The hostel fan is broken in room 123")
    assert "hostel" in res
    assert "fan" in res
    assert "broken" in res
    assert "room" in res
    assert "123" in res
    assert "the" in res
    
    assert "is" not in res
    assert "in" not in res

def test_classify_complaint(db):
    # Ensure default policies are created
    from app.pipeline.policies import ensure_default_policies
    ensure_default_policies(db)
    
    c = Complaint(title="No water in hostel", description="Water supply is completely absent since morning in block B.")
    extracted_tokens = classify_complaint(db, c)
    
    assert "water" in extracted_tokens
    assert "hostel" in extracted_tokens
    assert c.department is not None
    assert c.category is not None
    assert c.classification_confidence > 0.45

def test_classify_complaint_fallback(db):
    from app.pipeline.policies import ensure_default_policies
    ensure_default_policies(db)
    
    c = Complaint(title="Alien spaceship landed", description="There are aliens in the quad")
    classify_complaint(db, c)
    
    assert c.department == "General Review"
    assert c.category == "General"
    assert c.classification_confidence == 0.25
