---
id: docker
title: Docker & Compose
---

# Docker & Compose

## Services

`infra/docker-compose.yml` defines these services:

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `postgres` | postgres:16 | 5432 | Primary database |
| `redis` | redis:7-alpine | 6379 | Cache + Celery broker + pub/sub |
| `api` | (built from Dockerfile) | 8000 | FastAPI, health-checked |
| `celery-worker` | (same image) | — | Celery task worker |
| `celery-beat` | (same image) | — | Celery periodic task scheduler |
| `migrate` | (same image) | — | Profile: `migrate` — runs alembic upgrade head |
| `demo-seed` | (same image) | — | Profile: `demo` — waits for api health, then seeds |

## Starting Services

```bash
# All core services
docker compose up -d

# With specific profile
docker compose --profile migrate up
docker compose --profile demo up

# Or via Make:
make up
make migrate
make demo-seed
```

## API Health Check

The `api` service declares a health check so dependent services wait for it:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

The `demo-seed` service has `depends_on: api: condition: service_healthy`.

## Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml .
RUN pip install -e ".[dev]"
COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Environment Variables

Pass environment to containers via `env_file`:

```yaml
# docker-compose.yml
services:
  api:
    env_file:
      - ../backend/.env
```

Never commit the `.env` file. Use `.env.example` as a template.

## Persistent Volumes

```yaml
volumes:
  postgres_data:    # PostgreSQL data directory
  redis_data:       # Redis persistence (AOF)
```

Data persists across `docker compose down` but is removed by `docker compose down -v`.

## CI/CD Build

The GitHub Actions workflow builds and pushes to GHCR:

```yaml
ghcr.io/your-org/rakt-durg/api:latest
ghcr.io/your-org/rakt-durg/api:sha-{git-sha}
```

Uses BuildKit cache mounted to GitHub Actions cache for fast builds.
