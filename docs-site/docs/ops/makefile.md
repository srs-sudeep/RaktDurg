---
id: makefile
title: Makefile Reference
---

# Makefile Reference

All commands are run from the repository root.

## Docker & Services

| Target | Description |
|--------|-------------|
| `make up` | Start all Docker services (postgres, redis, api, celery) |
| `make down` | Stop all Docker services |
| `make logs` | Tail logs from all services |

## Database

| Target | Description |
|--------|-------------|
| `make migrate` | Run `alembic upgrade head` inside the migrate container |
| `make seed` | Load minimal seed (roles, feature flags) |
| `make demo-seed` | Load full demo data (users, donors, units, requisitions) |

## Backend

| Target | Description |
|--------|-------------|
| `make test` | Run pytest with coverage |
| `make lint` | Run ruff linter + mypy type checker |
| `make type-check` | Run mypy only |
| `make fmt` | Auto-format with ruff + isort |

## Web (React)

| Target | Description |
|--------|-------------|
| `make web-install` | `bun install` in the web directory |
| `make web-dev` | Start Vite dev server |
| `make web-build` | Production build |
| `make web-test` | Run Vitest |
| `make web-lint` | Run ESLint |
| `make web-type-check` | TypeScript type check |

## Mobile (Flutter)

| Target | Description |
|--------|-------------|
| `make flutter-get` | `flutter pub get` |
| `make flutter-build` | `flutter build apk` |
| `make flutter-test` | `flutter test` |
| `make flutter-analyze` | `flutter analyze` |

## Docs

| Target | Description |
|--------|-------------|
| `make docs-dev` | Start Docusaurus dev server (port 3000) |
| `make docs-build` | Build static docs site |

## Lifecycle

| Target | Description |
|--------|-------------|
| `make setup` | Full first-time setup (up + migrate + seed) |
| `make setup-fresh` | Fresh setup with demo data (up + migrate + demo-seed) |
| `make clean` | Remove `__pycache__`, `.pyc`, build artefacts |

## Example: Full Fresh Start

```bash
make setup-fresh
# Equivalent to:
# docker compose up -d
# docker compose --profile migrate up
# docker compose --profile demo up
```
