---
id: ci-cd
title: CI / CD
---

# CI / CD

RaktDurg uses three publish paths:

| Target | How it deploys | URL |
|--------|----------------|-----|
| App (API + web + monitoring) | Manual GitHub Actions workflow → GCE VM | http://8.231.102.114 |
| Docs site | Vercel Git integration from `docs-site/` | https://rakt-durg-docs.vercel.app/ |
| Mobile APK / iOS artifacts | Tag `v*` or **Release Mobile** workflow | [GitHub Releases](https://github.com/srs-sudeep/RaktDurg/releases) |

## App deploy (`CI / CD` workflow)

Defined in [`.github/workflows/ci.yml`](https://github.com/srs-sudeep/RaktDurg/blob/main/.github/workflows/ci.yml).

- Trigger: **`workflow_dispatch` only** — pushing to `main` does **not** update production
- Optional input: **Force reseed** (`force_reseed`) — wipe DB and run full `demo_seed`
- Syncs `backend/`, `web/`, `infra/` to the VM over SSH (AppleDouble/`._*` excluded)
- Builds with Docker layer cache
- Runs Alembic only when `backend/alembic/versions` changes
- Seeds:
  - `FORCE_RESEED` → wipe + `python -m seed.demo_seed`
  - empty `users` → `demo_seed`
  - otherwise → `ensure_organizers` (directory + `org_*` logins)
- Starts `api`, `web`, `nginx`, workers, **Prometheus**, and **Grafana**

### How to deploy

1. Merge / push to `main` (or the branch you will dispatch)
2. GitHub → **Actions** → **CI / CD** → **Run workflow**
3. Tick **Force reseed** only when you intentionally want a full demo wipe

```bash
gh workflow run "CI / CD" --ref main
# with reseed:
gh workflow run "CI / CD" --ref main -f force_reseed=true
```

Required secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`, `PROD_ENV_FILE`.

## Docs deploy (Vercel)

- Project root: `docs-site/` (`vercel.json` included)
- Environment: `Production – rakt-durg-docs`
- Live site: https://rakt-durg-docs.vercel.app/
- Deploys automatically when `docs-site/` changes land on the connected branch

Local preview:

```bash
make docs-install
make docs-dev
```

## Mobile release

Defined in [`.github/workflows/release-mobile.yml`](https://github.com/srs-sudeep/RaktDurg/blob/main/.github/workflows/release-mobile.yml).

- Android APK on `ubuntu-latest`
- iOS on `macos-latest` — signed IPA if Apple secrets exist, otherwise `*-ios-unsigned.zip`
- Prefer a single mobile tag line (e.g. `v0.1`) unless you intentionally cut a new release
