from app.models import Complaint, ProblemGroup
from app.services.problem_grouping import assign_complaint_to_group, recalculate_group

def test_assign_complaint_to_new_group(db):
    c1 = Complaint(student_id=1, 
        title="First issue in new category",
        description="This is completely unique",
        department="IT",
    )
    db.add(c1)
    db.commit()

    assignment = assign_complaint_to_group(db, c1)
    assert assignment.created is True
    assert assignment.group.department == "IT"
    assert c1.problem_group_id == assignment.group.id

def test_assign_complaint_to_existing_group(db):
    group = ProblemGroup(
        problem_code="IT-101",
        title="Internet is down",
        description="No internet connection in block A",
        department="IT",
        complaint_count=0,
        affected_users=0,
        status="open"
    )
    db.add(group)
    db.commit()

    c = Complaint(
        student_id=1, 
        title="Wi-Fi not working",
        description="No internet in block A",
        department="IT",
    )
    db.add(c)
    db.commit()

    assignment = assign_complaint_to_group(db, c, threshold=0.3)
    assert assignment.created is False
    assert assignment.group.id == group.id
    assert c.problem_group_id == group.id

def test_force_new_group(db):
    group = ProblemGroup(
        problem_code="IT-102",
        title="Internet is down",
        description="No internet connection in block A",
        department="IT",
        complaint_count=0,
        affected_users=0,
        status="open"
    )
    db.add(group)
    db.commit()

    c = Complaint(
        student_id=1, 
        title="Wi-Fi not working",
        description="No internet in block A",
        department="IT",
    )
    db.add(c)
    db.commit()

    # User clicked "Create New" despite warnings
    assignment = assign_complaint_to_group(db, c, force_new=True)
    assert assignment.created is True
    assert assignment.group.id != group.id
