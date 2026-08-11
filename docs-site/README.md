# RaktDurg docs site

<p align="center">
  <img src="static/img/logo.svg" alt="RaktDurg" width="96" />
</p>

Docusaurus documentation for the RaktDurg platform.

**Live:** https://rakt-durg-docs.vercel.app/

| | |
|--|--|
| App | http://8.231.102.114 |
| Login / demo | http://8.231.102.114/login |
| Demo accounts | https://rakt-durg-docs.vercel.app/demo |
| Staff UI guide | https://rakt-durg-docs.vercel.app/web/staff-ui |
| Grafana | http://8.231.102.114/grafana/ |
| Releases | https://github.com/srs-sudeep/RaktDurg/releases |

## Demo login (production + local demo seed)

| Username | Password |
|----------|----------|
| `superadmin` | `super123` |
| `district_admin` | `district123` |
| `dr_meena` | `meena123` |
| `organizer_priya` | `priya123` |
| `citizen_ajay` | `ajay123` |
| `org_<serial>` | `org123` |

Do **not** use `seed_superadmin` on the live app — see [Demo](https://rakt-durg-docs.vercel.app/demo) and [Seeds](https://rakt-durg-docs.vercel.app/ops/seeds).

## Local

```bash
bun install
bun run start    # http://localhost:3001
bun run build
```

## Vercel

This folder is the Vercel project root (`vercel.json` here). Deploys from `main` via the GitHub ↔ Vercel integration (`Production – rakt-durg-docs`).
