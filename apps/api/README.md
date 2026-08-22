# Complaint Intelligence API

FastAPI modular monolith for the Resolve MVP. The HTTP layer delegates to domain services so the in-memory repository can be replaced by PostgreSQL without rewriting the lifecycle.

## Development

```powershell
python -m pip install -e ".[dev]"
$env:PYTHONPATH = "."
fastapi dev app/main.py
```

The interactive contract is available at `http://localhost:8000/docs`.

All mutating complaint submissions accept an `Idempotency-Key` header and require a Bearer JWT. Students are restricted to their own complaints; staff are restricted to their department queue; central administrators can access analytics.

## Database and demo users

```powershell
alembic upgrade head
python -m app.db.seed
```

The seed creates controlled demo staff accounts (`admin.sih.demo@gmail.com`, `hostel.sih.demo@gmail.com`, `exams.sih.demo@gmail.com`, and `academics.sih.demo@gmail.com`) with password `DemoPass-2026!`. Change or remove them outside a synthetic demo environment.
