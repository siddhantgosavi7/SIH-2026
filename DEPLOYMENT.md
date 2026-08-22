# Deployment Guide

## Local production-like stack

```powershell
Copy-Item infra/.env.example infra/.env
# Replace JWT_SECRET in infra/.env with a long random value.
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build
```

The API applies Alembic migrations before starting. Seed synthetic demo accounts only when required:

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml exec api python -m app.db.seed
```

## Production release checklist

1. Use managed PostgreSQL with encrypted, tested backups.
2. Use managed Redis with authentication and TLS.
3. Store secrets in the deployment platform’s secret manager.
4. Set `APP_ENV=production`, restrict `CORS_ORIGINS`, and serve all traffic through HTTPS.
5. Apply `alembic upgrade head` before API rollout.
6. Schedule `python workers/run_sla_check.py` every minute; the RQ worker processes the job.
7. Monitor `/health`, `/ready`, worker failures, backups, and Redis availability.
