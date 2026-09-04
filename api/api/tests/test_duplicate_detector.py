from app.models import Complaint
from app.pipeline.duplicate_detector import detect_duplicates


def test_detect_duplicates_finds_similar(db):
    c1 = Complaint(
        student_id=1,
        title="Fan is broken in my room",
        description="The ceiling fan in my room is not working and making noise",
        department="Hostel",
    )
    db.add(c1)
    db.commit()

    c2 = Complaint(
        student_id=1,
        title="Fan is broken in my room",
        description="The ceiling fan in my room is not working and making loud noise",
        department="Hostel",
    )
    db.add(c2)
    db.flush()
    
    detect_duplicates(db, c2, f"{c2.title} {c2.description}")
    
    assert c2.duplicate_of_id == c1.id

def test_detect_duplicates_ignores_unrelated(db):
    c1 = Complaint(
        student_id=1,
        title="No water in bathroom",
        description="Water supply stopped",
        department="Hostel",
    )
    db.add(c1)
    db.commit()

    c2 = Complaint(
        student_id=1,
        title="Wi-Fi is slow",
        description="Internet keeps dropping in the library",
        department="IT",
    )
    db.add(c2)
    db.flush()
    
    detect_duplicates(db, c2, f"{c2.title} {c2.description}")
    
    assert c2.duplicate_of_id is None
