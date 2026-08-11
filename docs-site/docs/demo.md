---
id: demo
title: Demo & Live Links
sidebar_label: Demo & Live Links
---

# Demo & Live Links

## Live platform

| | URL |
|--|--|
| Web app | http://8.231.102.114 |
| Login | http://8.231.102.114/login |
| Public blood stock | http://8.231.102.114/public/stock |
| Public camps | http://8.231.102.114/public/camps |
| About | http://8.231.102.114/about |
| Docs (this site) | https://rakt-durg-docs.vercel.app/ |
| Grafana | http://8.231.102.114/grafana/ |
| API health | http://8.231.102.114/health |
| Mobile releases | https://github.com/srs-sudeep/RaktDurg/releases |

<p align="center">
  <img src="/img/logo.svg" alt="RaktDurg" width="96" />
</p>

<p align="center">
  <img src="/img/partners/IIT_Bhilai.svg" alt="IIT Bhilai" height="48" />
  &nbsp;&nbsp;
  <img src="/img/partners/IBITF.jpeg" alt="IBITF" height="40" />
  &nbsp;&nbsp;
  <img src="/img/partners/recogx.webp" alt="Recogx Init" height="36" />
</p>

<p align="center"><em>By IBITF and IIT Bhilai · Powered by Recogx Init</em></p>

## Production demo accounts

Production is reseeded with the **full demo seed** (`python -m seed.demo_seed`) when deploy runs with **Force reseed**, or on first boot of an empty DB.

### Named staff / citizen

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `super123` | superadmin — full staff + admin |
| `district_admin` | `district123` | district_admin — ops dashboards |
| `dr_meena` | `meena123` | doctor — clinical + camp review |
| `organizer_priya` | `priya123` | organizer — camp apply |
| `citizen_ajay` | `ajay123` | citizen — my account / stock / camps |

### Directory organizer logins

Each outreach-directory contact gets a login:

| Pattern | Password | Example |
|---------|----------|---------|
| `org_<source_serial>` | `org123` | `org_1`, `org_99`, `org_201` |

Open [Login](http://8.231.102.114/login) and use any row above.

```http
POST /auth/token
Content-Type: application/json

{"username":"superadmin","password":"super123"}
```

## Local demo seed

```bash
make demo-seed
```

Same named personas and `org_*` accounts as production demo seed.

Legacy **base seed** usernames (`seed_superadmin`, …) only appear if you run `python -m seed.seed` without the full demo seed.

## What to click after login

| Role | Start here |
|------|------------|
| Staff (superadmin / doctor / district_admin) | `/dashboard` — KPI strip + live stock matrix |
| | `/donors`, `/units`, `/requisitions` — searchable / sortable tables |
| | `/camps`, `/camps/approval`, `/camps/bookings` |
| | `/organizers`, `/organizer-directory`, `/citizens/link` |
| Superadmin only | `/users`, `/admin` (flags + e-RaktKosh) |
| Organizer | `/camps/apply`, `/camps` |
| Citizen | `/my-account`, `/public/stock`, `/public/camps` |

## Grafana

URL: http://8.231.102.114/grafana/

Default login until you override `GRAFANA_ADMIN_PASSWORD` in `PROD_ENV_FILE`:

- user: `admin`
- password: `changeme`

## Notes

- Production FastAPI Swagger (`/docs`) is **disabled**; use this documentation site for API guides.
- `/metrics` is not public — Prometheus scrapes it on the Docker network only.
- Wallet UI is behind the `wallet_enabled` feature flag.
- App deploys are **manual** (`Actions → CI / CD → Run workflow`). Pushing to `main` alone does not update the VM.
