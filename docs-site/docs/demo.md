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

These are the **base seed** accounts currently on the live VM (`python -m seed.seed` / auto-seed on empty DB).

| Username | Password | Role |
|----------|----------|------|
| `seed_superadmin` | `super123` | superadmin — full staff + admin |
| `seed_district_admin` | `district123` | district_admin — ops dashboards |
| `seed_doctor` | `doctor123` | doctor — clinical + camp review |
| `seed_organizer` | `organizer123` | organizer — camp apply |
| `seed_citizen` | `citizen123` | citizen — my account / stock / camps |

Open [Login](http://8.231.102.114/login) and use any row above.

```http
POST /auth/token
Content-Type: application/json

{"username":"seed_superadmin","password":"super123"}
```

## Local demo seed

For richer named personas locally:

```bash
make demo-seed
```

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `super123` | superadmin |
| `district_admin` | `district123` | district_admin |
| `dr_meena` | `meena123` | doctor |
| `organizer_priya` | `priya123` | organizer |
| `citizen_ajay` | `ajay123` | citizen |

## Grafana

URL: http://8.231.102.114/grafana/

Default login until you override `GRAFANA_ADMIN_PASSWORD` in `PROD_ENV_FILE`:

- user: `admin`
- password: `changeme`

## Notes

- Production FastAPI Swagger (`/docs`) is **disabled**; use this documentation site for API guides.
- `/metrics` is not public — Prometheus scrapes it on the Docker network only.
- Wallet UI is behind the `wallet_enabled` feature flag.
