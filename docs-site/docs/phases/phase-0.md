---
id: phase-0
title: "Phase 0: Foundations"
---

# Phase 0: Foundations

## Goal

Set up the project skeleton, developer tooling, database layer, authentication, and CI/CD pipeline. No business features — just the platform everything else runs on.

## Deliverables

### Project Structure

```
RaktDurg/
├── backend/
│   ├── app/
│   │   ├── core/          # security, config, barcode, FEFO, eligibility
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic v2 request/response schemas
│   │   ├── services/      # business logic
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── tasks/         # Celery workers
│   │   ├── adapters/      # external system stubs
│   │   └── main.py        # app factory
│   ├── alembic/           # database migrations
│   ├── seed/              # demo_seed.py
│   └── tests/
├── web/                   # React 18 + Vite + Bun
├── mobile/                # Flutter 3
├── infra/
│   └── docker-compose.yml
├── docs-site/             # Docusaurus
├── .github/workflows/ci.yml
└── Makefile
```

### Database Schema (Alembic)

All tables created in Phase 0:
- `facilities`, `users`, `refresh_tokens`
- `donors`, `screenings`, `donations`
- `blood_units`, `test_results`, `components`
- `barcode_sequences`
- `stock_ledger`, `audit_logs`
- `camps`, `coupons`, `organizers`
- `wallets`, `wallet_transactions`, `family_links`
- `requisitions`, `issues`
- `notifications`
- `sync_queue`
- `feature_flags`

### Authentication

- `POST /auth/token` — login, returns `access_token` + `refresh_token`
- `POST /auth/refresh` — exchange refresh token for new pair (rotation)
- `POST /auth/logout` — revoke refresh token
- Refresh tokens stored as SHA-256 hash in DB

### Developer Tooling

| Tool | Purpose |
|------|---------|
| `Makefile` | 30+ targets for common operations |
| `docker-compose.yml` | postgres, redis, api, celery, migrate, demo-seed services |
| `demo_seed.py` | Idempotent synthetic data: 8 users, 15 donors, 12 units |
| `.github/workflows/ci.yml` | lint → test → build → deploy pipeline |
| `vitest.config.ts` | Web unit tests |
| `eslint.config.js` | ESLint v9 flat config |

## Key Design Decisions Made in Phase 0

1. All PKs are UUIDs (`uuid_generate_v4()`)
2. `TimestampMixin` adds `created_at` + `updated_at`; `CreatedAtMixin` adds only `created_at` (used for `donations`)
3. `AuditLogMixin` — service layer calls `log_action()` for all state changes
4. Enums defined in models and imported into Pydantic schemas — single source of truth
5. Feature flag table seeded with `wallet_enabled = FALSE`
