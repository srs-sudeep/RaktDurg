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

These are the **same accounts on production** after `demo_seed` (live login: http://8.231.102.114/login).  
**Any role can sign in on web and mobile**; what they can do differs — see [Who can sign in where](./demo.md#who-can-sign-in-where).

| Role | Username | Password | Best for |
|------|----------|----------|----------|
| `superadmin` | `superadmin` | `super123` | Web staff or mobile field |
| `district_admin` | `district_admin` | `district123` | Web staff or mobile field |
| `doctor` | `dr_meena` | `meena123` | Web staff or mobile field |
| `organizer` | `organizer_priya` | `priya123` | **Web** camp apply |
| `citizen` | `citizen_ajay` | `ajay123` | Web or mobile citizen portal |
| `organizer` (directory) | `org_1` (etc.) | `org123` | **Web** camp apply |

```http
POST /auth/token
Content-Type: application/json

{"username":"superadmin","password":"super123"}
```

:::warning Dev passwords only
These passwords are for local / demo environments only.  
Do **not** use `seed_superadmin` on production — that username only exists after local `make seed` (see [Seeds](./ops/seeds.md)).
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
