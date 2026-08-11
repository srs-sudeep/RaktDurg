# RaktDurg

District-level digital blood bank platform for Durg District Hospital / Chhattisgarh Red Cross. Complements (does not replace) national e-RaktKosh.

**By IBITF and IIT Bhilai · Powered by Recogx Init**

| | URL |
|--|--|
| Web app | http://8.231.102.114 |
| Docs | https://rakt-durg-docs.vercel.app/ |
| Monitoring | http://8.231.102.114/grafana/ |
| GitHub Releases | https://github.com/srs-sudeep/RaktDurg/releases |

## Stack

| Layer | Tech |
|-------|------|
| API | FastAPI, SQLAlchemy async, Alembic, Celery, Postgres 16, Redis 7 |
| Web | React 18, Vite, TanStack Query, Tailwind (Bun) |
| Mobile | Flutter 3, Riverpod, sqflite, Dio |
| Docs | Docusaurus on [Vercel](https://rakt-durg-docs.vercel.app/) |
| Infra | Docker Compose + root `Makefile` · Prometheus / Grafana |
| CI / CD | GitHub Actions (VM deploy + mobile release) · Vercel (docs) |

## Prerequisites

- Docker Desktop
- [Bun](https://bun.sh) ≥ 1.1
- Flutter 3.x (for mobile)
- Free local ports: **8000** (API), **3000** (web), **3001** (docs), **5432**, **6379**

## Quick start (development)

```bash
cp infra/.env.example infra/.env
cp backend/.env.example backend/.env

make setup          # docker up → migrate → demo-seed → web install
make web-dev        # http://localhost:3000
```

API (local Swagger): http://localhost:8000/docs  
Health: http://localhost:8000/health  
Published docs: https://rakt-durg-docs.vercel.app/

### Docs site

Published continuously from `docs-site/` to Vercel: https://rakt-durg-docs.vercel.app/

```bash
make docs-install
make docs-dev       # http://localhost:3001
```

### Mobile

```bash
make flutter-get
# Android emulator:
make flutter-run-android
# iOS simulator (needs CocoaPods on PATH; uses Apple clang, not Homebrew gcc):
make flutter-run-ios
```

Barcode lookup uses manual entry on simulator (camera ML Kit is not arm64-ready for iOS 26 simulators). Pre-allocate + QR display still work.

## Demo logins (dev only)

Seeded by `make demo-seed` ([`backend/seed/demo_seed.py`](backend/seed/demo_seed.py)). Five roles — all can authenticate on web and mobile. Citizens now have dedicated account flows on both clients, while staff keep the operations dashboards.

| Username | Password | Role | Web access | Mobile |
|----------|----------|------|------------|--------|
| `superadmin` | `super123` | superadmin | Full staff nav + Admin | Field app |
| `district_admin` | `district123` | district_admin | Dashboard, Units, Donors, Camps, Requisitions | Field app (primary) |
| `dr_meena` | `meena123` | doctor | Clinical routes + camp approval | Field app |
| `organizer_priya` | `priya123` | organizer | Camps (apply) | Camp flows |
| `citizen_ajay` | `ajay123` | citizen | My Account, Profile, Wallet, Donation History, Camps, Bookings, Public Stock | Citizen dashboard + stock, wallet, profile, camps, bookings |

Public stock (no login): http://localhost:3000/public/stock?facility=`<facility-uuid>`  
Facility UUID is printed by `make demo-seed` and stored in `web/.env` as `VITE_DEFAULT_FACILITY_ID`.

Citizen entry points:
- Web: `/my-account`, `/public/camps`, `/public/stock`
- Mobile: citizen dashboard opens from the same login and includes stock, wallet, profile, history, camps, and bookings

Note: the wallet remains feature-flagged via `wallet_enabled`; citizen wallet screens show a disabled message until that flag is turned on.

Login body example: `{"username":"superadmin","password":"super123"}`.

## Production deployment

```bash
cp infra/.env.production.example infra/.env
# Edit infra/.env: POSTGRES_PASSWORD, SECRET_KEY, ALLOWED_ORIGINS, HTTP_PORT

make prod-build
make prod-up
make prod-migrate          # first deploy
make prod-demo-seed        # optional demo data (not for real production)
```

Production stack (`infra/docker-compose.prod.yml`):

- **nginx** on `HTTP_PORT` (default 80) — serves web SPA and reverse-proxies API routes
- **api**, **worker**, **beat** — no host ports; Postgres/Redis internal only
- Set `VITE_API_URL=` (empty) so the web app calls the API on the same origin via nginx
- Set `ALLOWED_ORIGINS` to your public URL(s) for CORS

### VM-only deploys

Production deploys can run entirely from the VM:

- Copy `backend/`, `web/`, and `infra/` to the server
- Run `infra/gce/deploy.sh`
- Docker Compose builds on the VM and brings the stack up there

This avoids GitHub Container Registry completely. If you prefer, run tests locally before pushing and use GitHub Actions only for deployment and tagged APK releases.

### GCE + GitHub Actions

For the GCE production path used by CI/CD:

```bash
# On the VM, once:
bash infra/gce/bootstrap-vm.sh
```

GitHub Actions expects these repository/environment secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH` (example: `/opt/raktdurg`)
- `PROD_ENV_FILE` (full contents of `infra/.env.production.example`, filled with real values)

Deploy flow (manual, cost-saving):

1. Trigger **Actions → CI / CD → Run workflow** (not on every push)
2. The job syncs `backend/`, `web/`, and `infra/` to the VM
3. The VM builds with Docker layer cache, migrates only when Alembic revisions change, seeds only if the DB has no users, and brings the stack up (including Prometheus + Grafana)

Docs deploy separately via Vercel from `docs-site/` → https://rakt-durg-docs.vercel.app/

### Android + iOS releases

Create these GitHub secrets to publish a signed APK to GitHub Releases:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Optional iOS signing secrets (omit to attach an unsigned `*-ios-unsigned.zip` instead of IPA):

- `IOS_DISTRIBUTION_CERT_BASE64`, `IOS_DISTRIBUTION_CERT_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`, `IOS_KEYCHAIN_PASSWORD`

Then push a tag such as:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Or run **Actions → Release Mobile** with a tag input. The workflow builds Android on Ubuntu and iOS on `macos-latest`.

## API notes

- Routes are mounted at the root (e.g. `/auth/token`, `/units`, `/stock/{id}`) — **no `/api/v1` prefix**.
- Login body is JSON: `{"username":"superadmin","password":"super123"}`.
- Barcode pre-allocation: `POST /barcodes/pre-allocate`.

## Useful Make targets

```bash
make help
make logs           # API logs (dev)
make prod-logs      # nginx + API logs (prod)
make demo-seed      # reload demo data
make down / down-v  # stop dev / wipe volumes
make prod-down      # stop production stack
make test           # backend pytest
make flutter-build-release
```

## Repo layout

```
backend/     FastAPI application
web/         Staff + public React app
mobile/      Flutter camp/offline app
docs/        Product BRD / TRD / plans
docs-site/   Developer documentation (Docusaurus → Vercel)
infra/       docker-compose + monitoring + env examples
```
