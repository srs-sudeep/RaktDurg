# RaktDurg

District-level digital blood bank platform for Durg District Hospital / Chhattisgarh Red Cross. Complements (does not replace) national e-RaktKosh.

**By IBITF and IIT Bhilai · Powered by Recogx Init**

## Stack

| Layer | Tech |
|-------|------|
| API | FastAPI, SQLAlchemy async, Alembic, Celery, Postgres 16, Redis 7 |
| Web | React 18, Vite, TanStack Query, Tailwind (Bun) |
| Mobile | Flutter 3, Riverpod, sqflite, Dio |
| Docs | Docusaurus |
| Infra | Docker Compose + root `Makefile` |

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

API docs: http://localhost:8000/docs  
Health: http://localhost:8000/health

### Docs site

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
# Edit infra/.env: POSTGRES_PASSWORD, SECRET_KEY, ALLOWED_ORIGINS, HTTP_PORT, GHCR_OWNER

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
- Set `GHCR_OWNER` and `IMAGE_TAG` when deploying prebuilt images from GitHub Container Registry

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
- `GHCR_USERNAME`
- `GHCR_READ_TOKEN`

Deploy flow:

1. Push to `main`
2. CI runs backend/web/flutter checks
3. API and web images are pushed to GHCR
4. The production job copies `infra/docker-compose.prod.yml`, `infra/nginx/nginx.conf`, and `infra/gce/deploy.sh` to the VM
5. The VM writes `.env`, pulls the exact image SHA, runs migrations, and brings the stack up

### Android APK releases

Create these GitHub secrets to publish a signed APK to GitHub Releases:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Then push a tag such as:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The `Release Mobile APK` workflow will build a signed release APK and upload it to the GitHub release for that tag. For local signing setup, copy `mobile/android/key.properties.example` to `mobile/android/key.properties` and point `storeFile` at your keystore path.

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
docs-site/   Developer documentation (Docusaurus)
infra/       docker-compose + env examples
```
