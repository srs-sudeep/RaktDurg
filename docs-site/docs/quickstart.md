---
id: quickstart
title: Quick Start
---

# Quick Start

Get RAKT Durg running locally in ~5 minutes using Docker Compose.

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Docker Desktop | 24+ |
| Docker Compose | v2.20+ |
| Bun | 1.1.34+ (web only) |
| Flutter SDK | 3.x (mobile only) |
| Make | Any (GNU/BSD) |

## 1 — Clone & Configure

```bash
# No git in restricted environments — download the zip from your internal registry
cp backend/.env.example backend/.env
# Edit backend/.env with your DB password, JWT secret, Redis URL
```

## 2 — Start Core Services

```bash
make up
# Brings up: postgres, redis, api, celery-worker, celery-beat
```

The API will be available at `http://localhost:8000`. Swagger UI at `http://localhost:8000/docs`.

Published docs (always online): https://rakt-durg-docs.vercel.app/

## 3 — Run Migrations

```bash
make migrate
# Runs: alembic upgrade head inside the migrate service container
```

## 4 — Load Demo Data

```bash
make demo-seed
# Named personas + directory organizer logins (org_<serial> / org123)
# plus inventory, camps, requisitions
```

### Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| `superadmin` | `superadmin` | `super123` |
| `district_admin` | `district_admin` | `district123` |
| `doctor` | `dr_meena` | `meena123` |
| `organizer` | `organizer_priya` | `priya123` |
| `citizen` | `citizen_ajay` | `ajay123` |
| `organizer` (directory) | `org_1` (etc.) | `org123` |

:::warning Dev passwords only
These passwords are for local / demo environments only.
:::

## 5 — Start the Web Dashboard

```bash
make web-install   # bun install
make web-dev       # vite dev server on http://localhost:3000
```

## 6 — Run Tests

```bash
make test          # backend pytest with coverage
make web-test      # vitest
make flutter-test  # flutter test
```

## Common Make Targets

```bash
make up            # start all containers
make down          # stop containers
make migrate       # run alembic migrations
make demo-seed     # load synthetic demo data
make seed          # load minimal seed (roles only)
make test          # run backend tests
make lint          # ruff + mypy
make fmt           # ruff format + isort
make web-dev       # vite dev server
make flutter-get   # flutter pub get
make docs-dev      # docusaurus dev server
make clean         # remove __pycache__, .pyc, build artefacts
```

See [Makefile Reference](./ops/makefile.md) for the full list.
