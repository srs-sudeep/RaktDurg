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

## Who can sign in where?

**Any seeded role can authenticate on both web and mobile** — one login API (`POST /auth/token`). Clients then route by JWT `role`.

| Role | Web | Mobile |
|------|-----|--------|
| `superadmin` | Full staff UI (all sidebar items) + `/admin`, `/users` | Field dashboard: register donor, screening, barcode, offline sync |
| `district_admin` | Units, donors, camps, requisitions, organizers, wallet | Field dashboard (clinical tools) |
| `doctor` | Clinical + camp **approvals** / booking queue | Field dashboard (clinical tools) |
| `organizer` | `/camps`, `/camps/apply` (primary) | Sign-in allowed; field tiles visible but **donor / screening / sync APIs reject organizer** — use web for camp apply |
| `citizen` | `/my-account/*` citizen portal | Citizen home: stock, wallet, camps, bookings, history, profile |

No login needed for: `/public/stock`, `/public/camps`, `/about`, `/contact`.

### Web — staff sidebar by role

| Area | Paths | Roles |
|------|-------|-------|
| Operations | `/dashboard`, `/units`, `/donors`, `/requisitions`, `/wallet` | see [Web RBAC](./web/rbac.md) |
| Camps | `/camps`, `/camps/apply`, `/camps/approval`, `/camps/bookings` | apply: organizer + superadmin; approval: doctor + superadmin |
| Directory | `/organizers`, `/organizer-directory`, `/citizens/link` | superadmin, district_admin, doctor |
| Admin | `/users`, `/admin` | superadmin only |
| Citizen portal | `/my-account`, … | `citizen` only (`CitizenShell`) |

### Mobile — home screen by role

| JWT role | Home | Features |
|----------|------|----------|
| `superadmin`, `district_admin`, `doctor` | Field dashboard | Register donor, screening (+ camp select), barcode scan, sync |
| `organizer` | Field dashboard UI | Prefer **web** for camp applications; clinical API calls return 403 |
| `citizen` | Citizen home | Stock, wallet, public camps / bookings, donation history, profile |

Demo accounts below work on both clients. Mobile builds: [GitHub Releases](https://github.com/srs-sudeep/RaktDurg/releases).

## Production / demo accounts

:::tip Use these on the live login page
Production runs the **full demo seed** (`python -m seed.demo_seed`) on first empty DB, or when deploy runs with **Force reseed**.

Do **not** use `seed_superadmin` (or any `seed_*` username) on production — those accounts are from the minimal local `make seed` path only and return **401** on the live app.
:::

### Named staff / citizen

| Username | Password | Role | Suggested client |
|----------|----------|------|------------------|
| `superadmin` | `super123` | superadmin — full staff + admin | Web or mobile |
| `district_admin` | `district123` | district_admin — ops dashboards | Web or mobile |
| `dr_meena` | `meena123` | doctor — clinical + camp review | Web or mobile |
| `organizer_priya` | `priya123` | organizer — camp apply | **Web** |
| `citizen_ajay` | `ajay123` | citizen — my account / stock / camps | Web or mobile |

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

Same named personas and `org_*` accounts as production (table above). Prefer this for local work.

## Local-only minimal seed (`make seed`)

```bash
make seed   # python -m seed.seed — roles/flags only, no rich demo data
```

| Username | Password | Role |
|----------|----------|------|
| `seed_superadmin` | `super123` | superadmin |
| `seed_district_admin` | `district123` | district_admin |
| `seed_doctor` | `doctor123` | doctor |
| `seed_organizer` | `organizer123` | organizer |
| `seed_citizen` | `citizen123` | citizen |

These **`seed_*` accounts are not present on production.** See [Demo Seeds](./ops/seeds.md).

## What to click after login

### Web

| Role | Start here |
|------|------------|
| Staff (superadmin / doctor / district_admin) | `/dashboard` — KPI strip + live stock matrix |
| | `/donors`, `/units`, `/requisitions` — searchable / sortable tables |
| | `/camps`, `/camps/approval`, `/camps/bookings` |
| | `/organizers`, `/organizer-directory`, `/citizens/link` |
| Superadmin only | `/users`, `/admin` (flags + e-RaktKosh) |
| Organizer | `/camps/apply`, `/camps` |
| Citizen | `/my-account`, `/public/stock`, `/public/camps` |

### Mobile

| Role | Start here |
|------|------------|
| Clinical staff | Field dashboard → Register donor / Screening / Sync |
| Organizer | Prefer web Apply; mobile clinical sync will 403 |
| Citizen | Citizen home → stock, camps, bookings |

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
