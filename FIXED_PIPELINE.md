# Fixed complaint intake pipeline

## Public request

`POST /complaints` accepts only:

```json
{
  "title": "Hostel Block A water outage",
  "description": "No water in Hostel Block A since morning."
}
```

The API rejects client-supplied `department`, `priority`, or `affected_users` with `422`.

## Internal flow

```text
Frontend
  |
  | title + description
  v
POST /complaints
  |
  v
intelligent_intake.build_payload()
  |
  +--> predict department
  |
  +--> find historical similar complaints
  |       |
  |       +--> distinct matching students
  |       +--> affected_users = 1 + distinct matching students
  |
  v
Create Complaint
  |
  v
existing analyze_complaint()
  |
  +--> classify complaint / SLA
  +--> calculate priority using affected_users
  +--> persist related/duplicate relations
  |
  v
auto-assign department staff
  |
  v
commit + response
```

A repeated complaint from the **same student** does not count that student twice. Deleted complaints are ignored.

## Main repaired files

- `api/api/app/services/intelligent_intake.py` — new intake wrapper.
- `api/api/app/pipeline/duplicate_detector.py` — reusable similarity search and relation persistence.
- `api/api/app/main.py` — `/complaints`, email intake, and PDF intake now use the wrapper.
- `api/api/app/schemas.py` — public `ComplaintCreate` is title + description only.
- `web/src/pages/MyProfile.jsx` — student form now sends only title + description.
- `api/api/app/models.py` — removed the stale problem-group ORM fields that were not created by the shipped migrations.
- `api/api/tests/` — tests updated for the new contract and added affected-user aggregation coverage.

## Verification

The backend test suite was executed against SQLite with external Redis/JWT/password services stubbed for the test environment:

`22 passed, 2 warnings`

The warnings are FastAPI's existing `on_event` deprecation warning and do not fail the suite.
