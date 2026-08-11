---
id: intro
title: Introduction
sidebar_label: Introduction
slug: /intro
---

# RAKT Durg

<p align="center">
  <img src="/img/logo.svg" alt="RaktDurg" width="120" />
</p>

<p align="center">
  <img src="/img/partners/IIT_Bhilai.svg" alt="IIT Bhilai" height="48" />
  &nbsp;&nbsp;
  <img src="/img/partners/IBITF.jpeg" alt="IBITF" height="40" />
  &nbsp;&nbsp;
  <img src="/img/partners/recogx.webp" alt="Recogx Init" height="36" />
</p>

<p align="center"><em>By IBITF and IIT Bhilai · Powered by Recogx Init</em></p>

RAKT Durg is a district-level digital blood bank management platform built for Durg District Hospital and the Chhattisgarh Red Cross Blood Bank. It **complements** (does not replace) the national e-RaktKosh system.

## Live links

| | URL |
|--|--|
| Documentation (this site) | https://rakt-durg-docs.vercel.app/ |
| Web app | http://8.231.102.114 |
| Login / demo | http://8.231.102.114/login |
| Public stock | http://8.231.102.114/public/stock |
| Grafana | http://8.231.102.114/grafana/ |
| Mobile releases | https://github.com/srs-sudeep/RaktDurg/releases |

Want credentials? → **[Demo & Live Links](./demo.md)**

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `super123` | superadmin |
| `district_admin` | `district123` | district_admin |
| `dr_meena` | `meena123` | doctor |
| `organizer_priya` | `priya123` | organizer |
| `citizen_ajay` | `ajay123` | citizen |

:::warning Not on production
`seed_superadmin` / other `seed_*` usernames are from local `make seed` only. Use the table above on the live app.
:::

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
│  Prometheus      │   Grafana   │   (production monitoring)  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Navigation

- Try the live demo → [Demo & Live Links](./demo.md)
- New here? → [Quick Start](./quickstart.md)
- Staff UI (tables / ERP shell) → [Staff UI & Tables](./web/staff-ui.md)
- Want the big picture? → [Architecture Overview](./architecture/overview.md)
- Setting up locally? → [Backend Setup](./backend/setup.md)
- API endpoints? → [API Reference Overview](./api/overview.md)
- Deploying? → [CI / CD](./ops/ci-cd.md) · [Docker & Compose](./ops/docker.md)

:::tip Deploy reminder
Pushing code to `main` updates this docs site (Vercel) but **not** the app VM. Run **Actions → CI / CD → Run workflow** to ship API/web.
:::
