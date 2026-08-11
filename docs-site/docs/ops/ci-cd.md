---
id: ci-cd
title: CI / CD
---

# CI / CD

The pipeline is defined in `.github/workflows/ci.yml` and runs on every push and pull request.

## Jobs

### `backend-lint`

```yaml
- ruff check backend/
- mypy backend/app/
```

Fails fast on linting or type errors before running slow tests.

### `backend-test`

Runs against a real PostgreSQL 16 and Redis 7 (service containers):

```yaml
services:
  postgres:
    image: postgres:16
    env: {POSTGRES_DB: rakt_test, POSTGRES_USER: rakt, POSTGRES_PASSWORD: rakt}
  redis:
    image: redis:7-alpine
```

Steps:
1. `alembic upgrade head`
2. `pytest --cov=app --cov-report=xml -q`
3. Upload coverage to Codecov

### `web-lint`

```yaml
- bun install
- bun run type-check
- bun run lint
```

### `web-test`

```yaml
- bun install
- bun run test:coverage
```

### `web-build`

```yaml
- bun install
- bun run build
- Upload dist/ as artifact
```

### `flutter-analyze`

```yaml
- flutter pub get
- flutter analyze
- flutter test
```

### `docker-build`

Only on `push` events (not PRs). Builds and pushes to GHCR:

```yaml
- uses: docker/build-push-action@v5
  with:
    context: backend/
    push: true
    tags: |
      ghcr.io/${{ github.repository }}/api:latest
      ghcr.io/${{ github.repository }}/api:sha-${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### `deploy-staging`

Runs on push to the `develop` branch. Deploys to the staging environment.

### `deploy-production`

Runs on push to the `main` branch. Uses a protected environment (`production`) requiring manual approval.

## Job Dependencies

```
backend-lint ──┐
backend-test   ├──→ docker-build ──→ deploy-staging ──→ deploy-production
web-lint       │
web-test       │
web-build ─────┘
flutter-analyze
```

## Secrets Required

Configure in GitHub repository settings:

| Secret | Purpose |
|--------|---------|
| `GHCR_TOKEN` | Push images to GitHub Container Registry |
| `CODECOV_TOKEN` | Upload coverage reports |
| `STAGING_SSH_KEY` | Deploy to staging server |
| `PROD_SSH_KEY` | Deploy to production server |
