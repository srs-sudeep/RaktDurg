<p align="center">
  <img src="web/public/logo.svg" alt="RaktDurg" width="120" />
</p>

<h1 align="center">RaktDurg</h1>

<p align="center">
  <strong>District-level digital blood bank platform</strong><br/>
  Durg District Hospital · Chhattisgarh Red Cross<br/>
  Complements (does not replace) national e-RaktKosh
</p>

<p align="center">
  <a href="http://8.231.102.114">Live app</a> ·
  <a href="https://rakt-durg-docs.vercel.app/">Docs</a> ·
  <a href="http://8.231.102.114/grafana/">Grafana</a> ·
  <a href="https://github.com/srs-sudeep/RaktDurg/releases">Releases</a> ·
  <a href="http://8.231.102.114/about">About</a> ·
  <a href="http://8.231.102.114/login">Login</a>
</p>

<p align="center">
  <img src="web/public/IIT_Bhilai.svg" alt="IIT Bhilai" height="48" />
  &nbsp;&nbsp;
  <img src="web/public/IBITF.jpeg" alt="IBITF" height="40" />
  &nbsp;&nbsp;
  <img src="web/public/recogx.webp" alt="Recogx Init" height="36" />
</p>

<p align="center"><em>By IBITF and IIT Bhilai · Powered by Recogx Init</em></p>

---

## Links

| | URL |
|--|--|
| **Web app** | http://8.231.102.114 |
| **Login** | http://8.231.102.114/login |
| **Public blood stock** | http://8.231.102.114/public/stock |
| **Public camps** | http://8.231.102.114/public/camps |
| **About** | http://8.231.102.114/about |
| **Docs** | https://rakt-durg-docs.vercel.app/ |
| **Monitoring (Grafana)** | http://8.231.102.114/grafana/ (`admin` / set via `GRAFANA_ADMIN_PASSWORD`) |
| **Mobile releases** | https://github.com/srs-sudeep/RaktDurg/releases |
| **API health** | http://8.231.102.114/health |

## Demo logins (production + local)

Production and local **`make demo-seed` / `seed.demo_seed`** share the same named personas (and directory organizer logins).

**Use these on the live app.** Do **not** use `seed_superadmin` / other `seed_*` usernames — those exist only after the minimal local `make seed` path and are **not** on production.

### Named accounts

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `super123` | superadmin |
| `district_admin` | `district123` | district_admin |
| `dr_meena` | `meena123` | doctor |
| `organizer_priya` | `priya123` | organizer |
| `citizen_ajay` | `ajay123` | citizen |
| `org_<serial>` | `org123` | organizer (directory) |

Try it: [http://8.231.102.114/login](http://8.231.102.114/login)

```http
POST /auth/token
Content-Type: application/json

{"username":"superadmin","password":"super123"}
```

Citizen entry points: `/my-account`, `/public/camps`, `/public/stock`  
Staff: `/dashboard` with searchable tables on donors / units / camps / etc.

Full account tables (including local-only `seed_*`): [Demo docs](https://rakt-durg-docs.vercel.app/demo) · [Seeds](https://rakt-durg-docs.vercel.app/ops/seeds)

> Wallet screens are gated by the `wallet_enabled` feature flag.  
> App deploy is **manual** (`Actions → CI / CD`). Docs deploy via Vercel from `docs-site/`.

## Stack

| Layer | Tech |
|-------|------|
| API | FastAPI, SQLAlchemy async, Alembic, Celery, Postgres 16, Redis 7 |
| Web | React 18, Vite, TanStack Query, Tailwind (Bun) |
| Mobile | Flutter 3, Riverpod, sqflite, Dio |
| Docs | Docusaurus on [Vercel](https://rakt-durg-docs.vercel.app/) |
| Infra | Docker Compose · Prometheus / Grafana |
| CI / CD | GitHub Actions (VM + mobile) · Vercel (docs) |

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

Local API Swagger: http://localhost:8000/docs  
Local health: http://localhost:8000/health  
Published docs: https://rakt-durg-docs.vercel.app/

### Docs site

```bash
make docs-install
make docs-dev       # http://localhost:3001
```

### Mobile

```bash
make flutter-get
make flutter-run-android
make flutter-run-ios      # needs CocoaPods; Apple clang
```

## Production deployment

```bash
cp infra/.env.production.example infra/.env
# Edit: POSTGRES_PASSWORD, SECRET_KEY, ALLOWED_ORIGINS, GRAFANA_ADMIN_PASSWORD, HTTP_PORT

make prod-build && make prod-up
make prod-migrate          # first deploy
# empty DB → demo_seed (named personas above); Force reseed wipes + re-runs demo_seed
```

### GCE + GitHub Actions

```bash
# On the VM, once:
bash infra/gce/bootstrap-vm.sh
```

Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`, `PROD_ENV_FILE`

Deploy is **manual** (`Actions → CI / CD → Run workflow`) to save Actions minutes. Optional **Force reseed** wipes the DB and runs `demo_seed`. Docs deploy automatically via Vercel from `docs-site/`.

### Mobile releases

Android signing secrets: `ANDROID_KEYSTORE_*`  
Optional iOS secrets: `IOS_DISTRIBUTION_*`, `IOS_PROVISIONING_PROFILE_BASE64`, `IOS_KEYCHAIN_PASSWORD`

```bash
git tag v0.1.0 && git push origin v0.1.0
# or: Actions → Release Mobile
```

## API notes

- Routes at root (`/auth/token`, `/units`, `/stock/{id}`) — **no `/api/v1` prefix**
- Login JSON: `{"username":"superadmin","password":"super123"}`
- Barcode pre-allocation: `POST /barcodes/pre-allocate`
- `/metrics` is Docker-internal only (Prometheus scrape)

## Useful Make targets

```bash
make help
make logs / make prod-logs
make demo-seed
make down / make down-v / make prod-down
make test
make flutter-build-release
```

## Repo layout

```
backend/     FastAPI application
web/         Staff + public React app
mobile/      Flutter camp/offline app
docs/        Product BRD / TRD / plans
docs-site/   Developer documentation → https://rakt-durg-docs.vercel.app/
infra/       compose, monitoring, GCE scripts
```
