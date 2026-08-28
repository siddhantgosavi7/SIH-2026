# Implementation Verification — 23 August 2026

## Canonical deployment stack

Use repository-root `api/`, `web/`, `docker-compose.yml`, and `docs/DEPLOYMENT.md`.
The older `apps/` tree is not the deployment target. It is retained until its
owner approves removal; do not mix its commands, ports, or environment files
with the root stack.

## Capability audit

| Area | Status | Evidence |
|---|---|---|
| PostgreSQL + Alembic + pgvector | Implemented | `api/models.py`, `api/alembic/`, `docker-compose.yml` |
| Persistent complaints, audit, idempotency | Implemented | SQLAlchemy models and migrations |
| JWT login + RBAC | Implemented | `/auth/login`, user roles, department-scoped queries |
| Environment secrets | Implemented | `api/.env.example`, startup validation for a 32+ character JWT secret |
| Redis/RQ + SLA escalation | Implemented for one worker | `api/app/worker.py`, `api/app/tasks.py` |
| Notifications | Implemented | persisted notifications; SMTP optional |
| Attachment validation | Partial | type/size checks and Docker volume; no malware scan or object store |
| Email intake | Partial | authenticated API intake endpoint, not inbound mailbox polling/webhook |
| PDF intake | Partial | PDF is accepted and stored; text/OCR extraction is absent |
| pgvector duplicate search | Partial | pgvector storage/index and deterministic demo embeddings; no real embedding provider |
| Reliability | Partial | audit, idempotency, rate limits, JSON logs, live/ready checks; no outbox/retry policy |
| API tests + AI fixtures | Implemented | lifecycle, regression, security tests and evaluation JSONL |
| Docker + CI | Implemented | API/web Dockerfiles, Compose, GitHub Actions |
| Web department dashboard | Partial | API endpoint exists; web integration needs checked against live Compose stack |

## Release gate

Not verified as deployable to real institutional data yet. Before release:

1. Run `docker compose up --build` after Docker CLI is available, then test login, migrations, worker, attachment volume, and restart persistence.
2. Configure a domain, HTTPS reverse proxy/load balancer, exact `ALLOWED_ORIGINS`, secret manager, managed PostgreSQL backups/PITR, and managed Redis.
3. Replace deterministic embeddings with an approved provider before claiming semantic duplicate detection.
4. Add malware scanning/object storage for attachments and real inbound email/PDF extraction before accepting untrusted intake.
5. Keep exactly one SLA worker replica, or replace its ticker with a leader-elected scheduler/CronJob.

## Safe SIH demo claim

`Login/RBAC → persistent complaint → department queue → attachment → SLA escalation → notification → audit history`.

Describe duplicate detection as deterministic demo matching, not production AI semantics.
