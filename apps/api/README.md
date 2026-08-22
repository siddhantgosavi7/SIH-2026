# Complaint Intelligence API

FastAPI modular monolith for the Resolve MVP. The HTTP layer delegates to domain services so the in-memory repository can be replaced by PostgreSQL without rewriting the lifecycle.

## Development

```powershell
python -m pip install -e ".[dev]"
$env:PYTHONPATH = "."
fastapi dev app/main.py
```

The interactive contract is available at `http://localhost:8000/docs`.

All mutating complaint submissions accept an `Idempotency-Key` header. The demo identity is supplied through `X-Student-Id`; production deployment must replace these headers with an authenticated JWT/SSO dependency and enforce department scope server-side.
