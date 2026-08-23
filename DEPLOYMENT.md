# Deployment Guide

The current deployment guide lives in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

This file previously documented the superseded `apps/` + `infra/` stack. That
stack is no longer the one built by `docker-compose.yml`, and the health
endpoints it referenced (`/health`, `/ready`) do not exist on the current API —
use `/health/live` and `/health/ready`.
