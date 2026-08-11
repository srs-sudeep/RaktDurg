---
id: setup
title: Backend Setup
---

# Backend Setup

## Requirements

- Python 3.12+
- Docker & Docker Compose v2
- Make

## Project Layout

```
backend/
├── app/
│   ├── core/
│   │   ├── barcode.py        # barcode generation + validation
│   │   ├── config.py         # Settings (pydantic-settings)
│   │   ├── database.py       # async engine + session factory
│   │   ├── eligibility.py    # screening rules
│   │   ├── fefo.py           # FEFO reservation
│   │   └── security.py       # JWT, bcrypt, RBAC dependency
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic v2 schemas
│   ├── services/             # business logic
│   ├── routers/              # FastAPI route handlers
│   ├── tasks/                # Celery workers
│   ├── adapters/             # external stubs
│   └── main.py
├── alembic/
│   ├── env.py
│   └── versions/
├── seed/
│   └── demo_seed.py
├── tests/
├── .env.example
├── pyproject.toml
└── Dockerfile
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
# backend/.env
DATABASE_URL=postgresql+asyncpg://rakt:rakt@localhost:5432/rakt_durg
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=change-me-in-production-min-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
CELERY_BROKER_URL=redis://localhost:6379/1
```

:::danger Never commit .env
The `.env` file is in `.gitignore`. Never commit real credentials.
:::

## Running Locally

### Option A: Docker Compose (recommended)

```bash
make up        # start postgres, redis, api, celery
make migrate   # alembic upgrade head
make demo-seed # named personas (superadmin / super123, …) + inventory
```

Login after demo seed: `superadmin` / `super123` (JSON `POST /auth/token`).  
See [Demo](../demo.md) · [Seeds](../ops/seeds.md). Local-only `make seed` creates `seed_*` users instead — prefer `demo-seed`.

### Option B: Local Python

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Dependencies (pyproject.toml)

```toml
[project]
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.111",
  "uvicorn[standard]>=0.30",
  "sqlalchemy[asyncio]>=2.0.30",
  "asyncpg>=0.29",
  "alembic>=1.13",
  "pydantic>=2.7",
  "pydantic-settings>=2.3",
  "python-jose[cryptography]>=3.3",
  "passlib[bcrypt]>=1.7",
  "celery>=5.4",
  "redis>=5.0",
  "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
  "pytest>=8",
  "pytest-asyncio>=0.23",
  "pytest-cov>=5",
  "ruff>=0.4",
  "mypy>=1.10",
]
```

## Celery Workers

The worker and beat scheduler run as separate containers in Docker Compose:

```bash
# Worker (processes tasks)
celery -A app.celery_app worker --loglevel=info

# Beat (schedules periodic tasks)
celery -A app.celery_app beat --loglevel=info
```

Scheduled tasks:
- `expire_components` — daily at 01:00, marks expired units/components
- `expire_wallet_credits` — daily at 01:30, expires old credits (skips if wallet disabled)
- `erakkosh_daily_export` — daily at 23:50, sends summary to e-RaktKosh
