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

Seeded by `make demo-seed` ([`backend/seed/demo_seed.py`](backend/seed/demo_seed.py)). All eight roles can **authenticate** on web and mobile; **web RBAC** restricts which pages each role sees. **Mobile** shows the same field-work UI for every logged-in user (API still enforces permissions).

| Username | Password | Role | Web access | Mobile |
|----------|----------|------|------------|--------|
| `admin` | `admin123` | admin | Full staff nav + Admin | Login + field UI |
| `dr_meena` | `meena123` | medical_officer | Dashboard, Units, Donors, Camps, Requisitions, Wallet | Login + field UI |
| `lab_rahul` | `rahul123` | lab_tech | Dashboard, Units, Donors | Login + field UI |
| `phlebotomist_seema` | `seema123` | phlebotomist | Dashboard, Units, Donors | Login + field UI (primary mobile user) |
| `inventory_ravi` | `ravi123` | inventory_officer | Dashboard, Units, Camps, Requisitions | Login + field UI |
| `organizer_priya` | `priya123` | organizer | Camps (apply) | Login + field UI |
| `donor_ajay` | `ajay123` | donor | Wallet only (redirect after login) | Login + field UI |
| `citizen_pooja` | `pooja123` | citizen_read | Public stock (redirect after login) | Login + field UI |

Public stock (no login): http://localhost:3000/public/stock?facility=`<facility-uuid>`  
Facility UUID is printed by `make demo-seed` and stored in `web/.env` as `VITE_DEFAULT_FACILITY_ID`.

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

## API notes

- Routes are mounted at the root (e.g. `/auth/token`, `/units`, `/stock/{id}`) — **no `/api/v1` prefix**.
- Login body is JSON: `{"username":"admin","password":"admin123"}`.
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
