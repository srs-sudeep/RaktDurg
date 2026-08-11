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
| `make seed` | Minimal local seed — `seed_*` users only (not production accounts) |
| `make demo-seed` | Full demo seed — `superadmin` / `super123`, inventory, camps (matches production) |

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
| `make docs-dev` | Start Docusaurus dev server (port 3001) |
| `make docs-build` | Build static docs site |

## Lifecycle

| Target | Description |
|--------|-------------|
| `make setup` | Full first-time setup (up + migrate + **demo-seed**) |
| `make setup-fresh` | Destroy volumes, then clean setup (up + migrate + demo-seed) |
| `make clean` | Remove `__pycache__`, `.pyc`, build artefacts |

Prefer `make demo-seed` / `make setup` so local logins match production (`superadmin` / `super123`).  
`make seed` alone creates `seed_superadmin` etc. — see [Seeds](./seeds.md).

## Example: Full Fresh Start

```bash
make setup-fresh
# Then open http://localhost:3000/login → superadmin / super123
```
