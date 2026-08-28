# Implementation Checklist

Status: `[x]` present, `[~]` partial, `[ ]` absent. Canonical stack is root
`api/`, `web/`, and `docker-compose.yml`.

## SIH demo minimum

- [x] PostgreSQL persistence, Alembic migrations, pgvector extension
- [x] JWT login and server-side RBAC
- [x] Department-scoped API queue and dashboard statistics
- [x] Persistent complaint/audit history
- [x] Redis/RQ worker, SLA escalation, persisted notifications
- [x] API lifecycle, RBAC, regression tests and AI evaluation fixtures
- [x] API/web Dockerfiles, Compose, CI workflow, deployment guide

## Remaining production work

- [~] Real embedding provider and semantic duplicate search
- [~] Live web dashboard verification against Compose API
- [~] Attachments: malware scanning and object storage
- [~] Inbound email provider/webhook and PDF text/OCR extraction
- [~] Outbox, job retry/dead-letter policy, scalable SLA scheduler
- [~] Cloud domain, HTTPS, secret manager, managed DB/Redis, backup restore drill
- [ ] Institutional OIDC/SSO integration
- [ ] Compose build/runtime verification on this machine

## Deployment decision

**SIH demo: go after local Docker verification. Production data: no-go until remaining production work is complete.**
