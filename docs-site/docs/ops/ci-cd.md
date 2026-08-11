---
id: ci-cd
title: CI / CD
---

# CI / CD

RaktDurg uses two publish paths:

| Target | How it deploys | URL |
|--------|----------------|-----|
| App (API + web + monitoring) | Manual GitHub Actions workflow → GCE VM | http://8.231.102.114 |
| Docs site | Vercel Git integration from `docs-site/` | https://rakt-durg-docs.vercel.app/ |
| Mobile APK / iOS artifacts | Tag `v*` or **Release Mobile** workflow | [GitHub Releases](https://github.com/srs-sudeep/RaktDurg/releases) |

## App deploy (`CI / CD` workflow)

Defined in [`.github/workflows/ci.yml`](https://github.com/srs-sudeep/RaktDurg/blob/main/.github/workflows/ci.yml).

- Trigger: **workflow_dispatch only** (not on every push — saves Actions minutes)
- Syncs `backend/`, `web/`, `infra/` to the VM over SSH (AppleDouble/`._*` excluded)
- Builds with Docker layer cache
- Runs Alembic only when `backend/alembic/versions` changes
- Seeds login accounts only when the `users` table is empty
- Starts `api`, `web`, `nginx`, workers, **Prometheus**, and **Grafana**

Required secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`, `PROD_ENV_FILE`.

## Docs deploy (Vercel)

- Project root: `docs-site/` (`vercel.json` included)
- Environment: `Production – rakt-durg-docs`
- Live site: https://rakt-durg-docs.vercel.app/

Local preview:

```bash
make docs-install
make docs-dev
```

## Mobile release

Defined in [`.github/workflows/release-mobile.yml`](https://github.com/srs-sudeep/RaktDurg/blob/main/.github/workflows/release-mobile.yml).

- Android APK on `ubuntu-latest`
- iOS on `macos-latest` — signed IPA if Apple secrets exist, otherwise `*-ios-unsigned.zip`
