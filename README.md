# Resolve — Grievance Intelligence Platform

Resolve turns unstructured student complaints into a transparent, prioritized, and accountable departmental workflow. It combines the SMA03 intake/routing capability with the MSC02 prioritization capability in one lifecycle:

`Submit → Classify → Detect related issues → Prioritize → Route → Assign → Resolve → Validate → Audit`

## Current MVP

- FastAPI API with idempotent complaint intake, deterministic explainable classification, priority factors, duplicate clustering, routing, assignment, state-transition validation, resolution, student validation/reopen, analytics, and audit events.
- Next.js student portal with a responsive intake and activity dashboard.
- PostgreSQL/pgvector Docker service reserved for the persistence adapter; the current repository adapter keeps the demo runnable without external services.

## Run locally

### API

```powershell
cd apps/api
python -m pip install -e ".[dev]"
$env:PYTHONPATH = "."
fastapi dev app/main.py
```

API docs: `http://localhost:8000/docs`

### Web

```powershell
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000`. Copy `.env.example` to `.env.local` when the API runs on another URL.

## Production hardening roadmap

Replace `ComplaintStore` with SQLAlchemy/PostgreSQL migrations, add institutional authentication and server-side RBAC, move classification/SLA work to a queue, store embeddings in pgvector, and add attachment scanning and rate limiting. The service boundaries already keep those changes isolated from the HTTP contracts.

The full product and judge-facing rationale are in [`Doc/README.md`](Doc/README.md) and [`Doc/24_FINAL_ARCHITECTURE.md`](Doc/24_FINAL_ARCHITECTURE.md).
