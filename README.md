# SIH Complaint Platform

Deployable starter for a student complaint system with persistent history, login/RBAC, department queues, SLA escalation, audit log, idempotency, rate limiting, attachment validation, email/PDF intake hooks, pgvector duplicate table, tests, Docker, and CI.

## Quick Start

```bash
cp api/.env.example api/.env
docker compose up --build
```

API: `http://localhost:8000`

Web: `http://localhost:5173`

Docs: `http://localhost:8000/docs`

The API package layout and complaint pipeline are documented in [api/ARCHITECTURE.md](api/ARCHITECTURE.md).

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `api/.env` before first boot. No demo credentials are hard-coded.

The `worker` container runs the RQ queue and re-checks SLAs every
`SLA_CHECK_INTERVAL_SECONDS` (default 300), escalating breached complaints and
writing an escalation notification. Delivery goes out over SMTP when `SMTP_HOST`
and `SMTP_FROM` are set; otherwise the notification is stored and readable at
`GET /notifications`. `POST /admin/sla-check` forces a check immediately.

## Local API Dev

```bash
cd api
python -m venv .venv
.venv\Scripts\activate       # Windows PowerShell
# source .venv/bin/activate   # WSL/Linux
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Do not install the API requirements into the system Python. On WSL/Linux, use
`python3 -m venv .venv`, then `.venv/bin/python -m pip install -r requirements.txt`.
In VS Code, select `api/.venv` as the Python interpreter so imports such as
`fastapi` in `app/api/routes/dashboard.py` resolve correctly.

The Docker image uses Python 3.12. Python 3.14 is also supported with the
current SQLAlchemy constraint in `api/requirements.txt`.

## Test

```bash
cd api
pytest
```

## Production Notes

- Use managed PostgreSQL with daily backups and point-in-time recovery.
- Use managed Redis or a locked-down Redis service.
- Put API behind HTTPS reverse proxy/load balancer.
- Rotate `JWT_SECRET` and all SMTP/OIDC secrets with secret manager.
- Configure `ALLOWED_ORIGINS` to exact production web domain.
- Add institutional SSO by setting OIDC env values and replacing `/auth/login` with OIDC callback/token verification.
