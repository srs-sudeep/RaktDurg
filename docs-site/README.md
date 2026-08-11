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

Any role can **authenticate** on web and mobile. Feature access still follows RBAC — [who can sign in where](https://rakt-durg-docs.vercel.app/demo#who-can-sign-in-where).

| Username | Password | Web | Mobile |
|----------|----------|-----|--------|
| `superadmin` | `super123` | staff | field |
| `district_admin` | `district123` | staff | field |
| `dr_meena` | `meena123` | staff | field |
| `organizer_priya` | `priya123` | camps / apply | prefer web |
| `citizen_ajay` | `ajay123` | citizen portal | citizen home |
| `org_<serial>` | `org123` | camps / apply | prefer web |

Do **not** use `seed_superadmin` on the live app — see [Demo](https://rakt-durg-docs.vercel.app/demo) and [Seeds](https://rakt-durg-docs.vercel.app/ops/seeds).

## Local

```bash
bun install
bun run start    # http://localhost:3001
bun run build
```

## Vercel

This folder is the Vercel project root (`vercel.json` here). Deploys from `main` via the GitHub ↔ Vercel integration (`Production – rakt-durg-docs`).
