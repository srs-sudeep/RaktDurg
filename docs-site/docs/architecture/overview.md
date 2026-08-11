---
id: overview
title: Architecture Overview
---

# Architecture Overview

## System Context

```
                    ┌─────────────────────┐
                    │   National e-RaktKosh│  (daily export only)
                    └──────────┬──────────┘
                               │ JSON export via Celery task
                    ┌──────────▼──────────┐
                    │   RAKT Durg API      │
                    │   FastAPI / Python   │
          ┌─────────┤   8000              ├─────────┐
          │         └──────────┬──────────┘         │
          │                    │                    │
   ┌──────▼──────┐    ┌────────▼────────┐   ┌──────▼──────┐
   │ Web Dashboard│    │  PostgreSQL 16  │   │  Mobile App  │
   │ React / Vite │    │  (primary data) │   │  Flutter 3   │
   │  :5173       │    └────────┬────────┘   │  offline-cap │
   └─────────────┘             │             └─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Redis 7           │
                    │  cache · pub/sub     │
                    │  Celery broker       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Celery Workers      │
                    │  expiry · notif      │
                    │  e-RaktKosh export   │
                    └─────────────────────┘
```

## Request Flow — Authenticated Staff Action

```
Browser/App
  │  POST /units/{id}/state  (Bearer JWT)
  ▼
FastAPI Router
  │  verify_token dependency → decode JWT → load User from DB
  │  require_roles([lab_tech, medical_officer]) check
  ▼
Service Layer (app/services/units.py)
  │  validate transition via VALID_TRANSITIONS dict
  │  async SQLAlchemy session.execute(...)
  ▼
PostgreSQL (blood_units, audit_logs, stock_ledger)
  │  RULE blocks UPDATE/DELETE on audit_logs
  ▼
stock.post_ledger_entry()
  │  compute balance_after from MAX(id) WHERE facility_id = ...
  │  INSERT stock_ledger row
  ▼
Redis publish("stock:updates", json)  ← fire-and-forget
  ▼
SSE stream → Dashboard
```

## Real-time Stock Stream

```
Client Dashboard
  EventSource /stream/stock/{facility_id}
       │
       │  SSE generator (async for)
       ▼
  FastAPI SSE endpoint
       │  subscribe to Redis channel "stock:updates"
       │  keepalive every 30 seconds
       ▼
  Redis pub/sub
       ▲
       │  publish() called after every ledger write
  stock service
```

## Offline Sync Flow (Mobile)

```
Flutter App (sqflite)
  ┌────────────────────────────────┐
  │ capture screening offline      │
  │ store ScreeningRecord + sync_id│
  └────────────┬───────────────────┘
               │  connectivity restored
               ▼
  SyncManager.sync()
  ┌────────────────────────────────┐
  │ getPending() → batch of 20     │
  │ POST /sync  → BulkSyncRequest  │
  └────────────┬───────────────────┘
               │
               ▼
  API /sync endpoint
  ┌────────────────────────────────┐
  │ check sync_queue for sync_id   │ ← idempotent
  │ detect conflicts (±2h window)  │
  │ process inline via service     │
  │ return SyncItemResult[]        │
  └────────────┬───────────────────┘
               │
               ▼
  Flutter markSynced(sync_id)
```

## Component Separation

| Module | Location | Responsibility |
|--------|----------|----------------|
| Models | `backend/app/models/` | SQLAlchemy ORM mapped classes |
| Schemas | `backend/app/schemas/` | Pydantic v2 request/response |
| Services | `backend/app/services/` | Business logic, transactions |
| Routers | `backend/app/routers/` | FastAPI route handlers |
| Tasks | `backend/app/tasks/` | Celery async workers |
| Adapters | `backend/app/adapters/` | External system stubs (ABHA, e-RaktKosh, notifications) |
| Core | `backend/app/core/` | Barcode, FEFO, eligibility, security |
