---
id: tech-stack
title: Tech Stack
---

# Tech Stack

## Backend

| Component | Choice | Reason |
|-----------|--------|--------|
| Language | Python 3.12 | Mature async ecosystem; strong typing with Pydantic v2 |
| Framework | FastAPI | Async-native, auto OpenAPI, dependency injection |
| ORM | SQLAlchemy 2.x async | Typed, efficient, `SELECT … FOR UPDATE SKIP LOCKED` support |
| Migrations | Alembic | Industry standard for SQLAlchemy; supports partial indexes |
| Validation | Pydantic v2 | Rust-powered, model_validator, strict mode |
| Task queue | Celery 5 + Redis 7 | Reliable scheduling; beat for cron jobs |
| Auth | JWT + bcrypt | Short-lived access (15 min) + long-lived refresh (7 days) |
| Testing | pytest + pytest-asyncio | Async fixtures, coverage via pytest-cov |
| Linting | ruff + mypy | Fast Rust linter + strict type checking |

## Database

| Feature | Detail |
|---------|--------|
| Engine | PostgreSQL 16 |
| UUID primary keys | `uuid_generate_v4()` extension |
| Audit protection | PostgreSQL RULE blocks UPDATE/DELETE on `audit_logs` |
| FEFO concurrency | `SELECT … FOR UPDATE SKIP LOCKED` on `components` |
| Calendar blocking | Partial unique index on `(host_facility_id, requested_date) WHERE status IN (...)` |
| Full-text | `tsvector` on donor name for search |

## Web Frontend

| Component | Choice |
|-----------|--------|
| Runtime / package manager | Bun 1.1.34 |
| Build tool | Vite 5 |
| UI framework | React 18 |
| Server state | TanStack Query v5 |
| Component library | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 (with RBAC guards) |
| HTTP client | Axios (with interceptors) |
| Testing | Vitest + @testing-library/react |
| Linting | ESLint v9 flat config + typescript-eslint |

## Mobile

| Component | Choice |
|-----------|--------|
| Framework | Flutter 3.x (Dart) |
| State management | Riverpod (StateNotifier) |
| Local persistence | sqflite |
| HTTP | Dio + interceptors |
| Secure storage | flutter_secure_storage |
| Navigation | go_router |
| QR scanning | mobile_scanner |
| QR generation | qr_flutter |

## Infrastructure

| Component | Detail |
|-----------|--------|
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions (lint → test → build → deploy) |
| Container registry | GitHub Container Registry (ghcr.io) |
| Cache | Redis 7 (Celery broker + API cache + pub/sub) |
| Real-time | Server-Sent Events (SSE) via FastAPI |
| Docs | Docusaurus v3 + Bun |
