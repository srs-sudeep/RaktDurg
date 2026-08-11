---
id: intro
title: Introduction
sidebar_label: Introduction
slug: /intro
---

# RAKT Durg

RAKT Durg is a district-level digital blood bank management platform built for Durg District Hospital and the Chhattisgarh Red Cross Blood Bank. It **complements** (does not replace) the national e-RaktKosh system.

## What Problem Does It Solve?

The national e-RaktKosh portal is optimised for state-level aggregation and reporting. District blood banks need:

- Real-time unit-level inventory with barcode scanning
- Offline-capable mobile screening at donation camps (often held in areas with poor connectivity)
- First-Expiry-First-Out (FEFO) automated reservation to minimise wastage
- Camp planning and coupon management
- Donor reward wallet (feature-flagged for future activation)
- Requisition workflows for hospital wards

RAKT Durg provides all of this as a self-hosted, auditable system that also exports a daily summary to e-RaktKosh.

## Key Principles

| Principle | Implementation |
|-----------|----------------|
| **No real PII in dev** | Only synthetic/mock donor data in seeds |
| **No raw Aadhaar** | ABHA reference (masked) stored; raw number never persisted |
| **No secrets in source** | All credentials via `.env` / Docker secrets |
| **Append-only audit** | PostgreSQL RULE blocks UPDATE/DELETE on `audit_logs` |
| **Feature flags** | Wallet stays off in production until sign-off |
| **DPDP compliance** | Consent fields, data retention policy enforced at schema level |

## Platform Components

```
┌─────────────────────────────────────────────────────────────┐
│  Web Dashboard (React 18 + Vite + Bun)                      │
│  – Authenticated staff portal  – Public stock page          │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (Flutter 3 + Riverpod)                          │
│  – Offline donor screening     – QR barcode scanning        │
├─────────────────────────────────────────────────────────────┤
│  REST API (FastAPI + Python 3.12)                           │
│  – JWT auth / RBAC            – SSE stock stream            │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 16   │   Redis 7   │   Celery 5 workers         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Navigation

- New here? → [Quick Start](./quickstart.md)
- Want the big picture? → [Architecture Overview](./architecture/overview.md)
- Setting up locally? → [Backend Setup](./backend/setup.md)
- API endpoints? → [API Reference Overview](./api/overview.md)
- Deploying? → [Docker & Compose](./ops/docker.md)
