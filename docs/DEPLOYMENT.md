# Deployment Plan

## Minimum SIH Demo

1. Copy `api/.env.example` to `api/.env`.
2. Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, SMTP values if escalation email should send externally.
3. Run `docker compose up --build`.
4. Open API docs at `/docs`, create student/staff users using admin JWT, then demo:
   - student creates complaint and attaches a file,
   - staff sees only department queue,
   - staff transitions status,
   - SLA breach escalates automatically (worker ticks every
     `SLA_CHECK_INTERVAL_SECONDS`); `POST /admin/sla-check` forces it on demand,
   - escalation notification appears at `GET /notifications`,
   - history remains after restart because PostgreSQL volume persists.

Set `VITE_API_BASE_URL` before building the web image when the API is not on
`http://localhost:8000` — Vite inlines it at build time, so setting it at
container runtime has no effect.

## Production

- Database: managed PostgreSQL 16 with pgvector, automated daily backup, point-in-time recovery, weekly restore drill.
- Redis: managed Redis with private networking and auth.
- HTTPS/domain: terminate TLS at Caddy, Nginx Proxy Manager, cloud load balancer, or ingress controller. Point app domain to web service and `api.<domain>` to API service.
- Secrets: store `JWT_SECRET`, DB password, SMTP credentials, and OIDC credentials in cloud secret manager, never in Git.
- CI/CD: `.github/workflows/ci.yml` runs API tests and web build. Add deploy job with environment approval after tests pass.
- Backups: nightly `pg_dump` to encrypted object storage plus provider PITR. Keep 30 daily, 12 monthly snapshots.
- Observability: ship JSON logs to hosted log service, alert on `/health/ready` failure, worker queue growth, DB errors, and SLA escalations.
- Rate limiting: set `TRUST_PROXY_HEADERS=true` only once the proxy overwrites
  `X-Forwarded-For`. Left false behind a proxy, every client shares one bucket;
  set true without a rewriting proxy and clients can spoof the header.
- Worker replicas: the SLA ticker runs in-process with no leader election. Keep
  the worker at one replica, or move the tick to an external scheduler before
  scaling out, otherwise escalation mail is sent more than once.
