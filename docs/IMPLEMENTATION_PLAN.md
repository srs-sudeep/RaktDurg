# RAKT Durg — Implementation Plan

| | |
|---|---|
| **Status** | ACTIVE — Phases 0–5 implemented in code; Phase 6 (hardening/prod) open |
| **References** | BRD v0.1, TRD v0.1, Proposal v0.1 |
| **Date** | 2026-08-11 |

---

## 0. How to Read This Document

Section 1 confirms the architecture and flags deviations from the TRD. Section 2 defines the repository layout. Section 3 is the complete data schema. Section 4 is the phase-by-phase build plan. Section 5 lists assumptions and blocking questions. **No application code is written until this plan is approved.**

---

## 1. Architecture & Technology Stack

### 1.1 Confirmed Stack

The TRD reference stack is adopted with the changes and additions documented in §1.2.

| Layer | Choice | Status |
|---|---|---|
| Backend API | Python 3.12, FastAPI, Pydantic v2 | Confirmed |
| ORM / migrations | SQLAlchemy 2.x (async), Alembic | Confirmed |
| Database | PostgreSQL 16 | Confirmed |
| Admin/staff web | React 18, Vite, **TanStack Query v5**, **shadcn/ui**, **React Router v6**, Tailwind CSS | Confirmed |
| Web auth/RBAC | React Router route guards + JWT context + role-based `<ProtectedRoute>` | Confirmed |
| Mobile (donor + camp) | **Flutter 3.x** (Dart) — replaces React Native | Changed (see §1.2) |
| Mobile offline storage | **sqflite** (SQLite on Flutter) | Confirmed |
| Mobile barcode | **mobile_scanner** (scan) + **qr_flutter** (render/print QR) | Confirmed |
| Barcode | Code128/QR MVP, ISBT 128–compatible ID design | Confirmed |
| Auth | JWT (access 15 min / refresh 7 days) + RBAC | Confirmed |
| Task queue | **Celery 5 + Redis 7** | Added (see §1.2) |
| Cache | **Redis 7** | Added (see §1.2) |
| Real-time push | **Server-Sent Events (SSE)** via FastAPI | Added (see §1.2) |
| Containerization | Docker + docker-compose | Confirmed |
| CI | GitHub Actions | Confirmed |

### 1.2 Deviations and Additions from TRD (with reasoning)

**1. Flutter replaces React Native (Expo)**

The TRD listed React Native as the mobile choice, with Node/NestJS and Flutter as named alternatives. Flutter is chosen over React Native because: (a) a single Dart codebase produces native ARM binaries on Android and iOS with better performance on lower-end devices common in field/camp use; (b) Flutter's `sqflite` and offline-first patterns are well-established; (c) `mobile_scanner` provides reliable camera-based barcode scanning without the bridging overhead of React Native camera modules; (d) it avoids JavaScript fatigue from having React on both web and mobile. The backend API contract is identical regardless of mobile choice.

**2. React web stack made explicit: TanStack Query + shadcn/ui + React Router v6**

TanStack Query v5 handles all server state (fetching, caching, optimistic updates, background refetch). shadcn/ui provides accessible, Tailwind-integrated Radix primitives with zero unused-component overhead. React Router v6 (data router mode) provides file-based routing with loaders and actions, which pairs well with role-based route protection.

RBAC on the web is implemented as a `<ProtectedRoute roles={[...]}>` wrapper component that reads the current user's role from JWT claims (decoded in an `AuthContext`). Routes are defined with required roles; a user landing on an unauthorized route is redirected to `/unauthorized`. The role list mirrors the backend enum exactly: `admin`, `medical_officer`, `lab_tech`, `phlebotomist`, `inventory_officer`, `organizer`, `donor`, `citizen_read`.

**3. Redis + Celery added (not in TRD)**

The TRD's API-only design lacks a mechanism for: (a) async notification delivery with retries, (b) the scheduled e-RaktKosh export job, (c) the wallet credit-expiry sweeper, and (d) caching the public stock endpoint (citizen traffic spikes). FastAPI background tasks are fire-and-forget with no retry. Celery solves all four. Redis serves as both the Celery broker and the stock-cache store.

**4. Server-Sent Events (SSE) for real-time stock dashboard**

The TRD specifies a "live stock dashboard" (BR-DASH-01) but does not define the push mechanism. SSE (HTTP/1.1 streaming, FastAPI `EventSourceResponse`) is unidirectional (server → client), lightweight, and perfectly suited to a stock-ticker pattern. The web client subscribes to `/stream/stock`; Postgres `LISTEN/NOTIFY` on ledger insert triggers SSE emission.

**5. Offline barcode pre-allocation model**

Two approaches were considered: (a) generate provisional barcodes on-device and replace on sync — labels would need reprinting; (b) pre-allocate a range from the server before going offline — labels are permanent from the moment of printing. **Approach (b) is chosen.** A phlebotomist fetches a barcode batch (`POST /barcodes/pre-allocate`) before leaving for a camp. On sync, used barcodes are confirmed and unused ones are released.

---

## 2. Repository Structure

```
rakt-durg/
├── backend/                      FastAPI service
│   ├── app/
│   │   ├── main.py               Application entry point
│   │   ├── config.py             Settings (pydantic-settings)
│   │   ├── database.py           SQLAlchemy async engine + session factory
│   │   ├── models/               SQLAlchemy ORM models (one file per domain)
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── auth.py           User, Role, RefreshToken
│   │   │   ├── donor.py          Donor, Screening, Donation
│   │   │   ├── unit.py           BloodUnit, TestResult, Component
│   │   │   ├── camp.py           Camp, CampCoupon, Organizer
│   │   │   ├── stock.py          StockLedger, AlertThreshold
│   │   │   ├── requisition.py    Requisition, Issue
│   │   │   ├── wallet.py         WalletAccount, WalletTxn, WalletFamilyLink
│   │   │   ├── notification.py   Notification
│   │   │   └── audit.py          AuditLog, FeatureFlag, SyncQueue, BarcodeAllocation
│   │   ├── schemas/              Pydantic v2 request/response schemas
│   │   ├── routers/              FastAPI routers (one per domain)
│   │   ├── services/             Business logic (pure functions, no HTTP)
│   │   ├── adapters/             External integration adapters
│   │   │   ├── abha.py           ABHA/ABDM interface + mock
│   │   │   ├── notification.py   WhatsApp/SMS interface + mock
│   │   │   └── erakkosh.py       e-RaktKosh export interface + stub
│   │   ├── middleware/
│   │   │   ├── audit.py          Audit-log middleware
│   │   │   └── rbac.py           RBAC dependency
│   │   ├── tasks/                Celery task modules
│   │   │   ├── celery_app.py
│   │   │   ├── notifications.py
│   │   │   ├── expiry.py         Wallet + unit expiry sweepers
│   │   │   └── export.py         e-RaktKosh export job
│   │   └── core/
│   │       ├── barcode.py        Barcode generation + ISBT-compatible ID scheme
│   │       ├── fefo.py           FEFO reservation logic
│   │       ├── eligibility.py    Donor eligibility / deferral rules engine
│   │       └── sync.py           Offline sync conflict resolution
│   ├── alembic/                  Alembic env + migrations
│   ├── tests/
│   │   ├── conftest.py           Fixtures (test DB, auth headers)
│   │   ├── test_auth.py
│   │   ├── test_units.py
│   │   ├── test_donors.py
│   │   ├── test_camps.py
│   │   ├── test_requisitions.py
│   │   ├── test_wallet.py
│   │   ├── test_sync.py
│   │   └── test_audit.py
│   ├── seed/                     Synthetic seed data (no real PII)
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── .env.example
│
├── web/                          React admin / staff dashboard
│   ├── src/
│   │   ├── routes/               React Router v6 route tree
│   │   │   ├── index.tsx         Root layout + router definition
│   │   │   ├── auth/             Login, token-refresh handling
│   │   │   ├── dashboard/        Stock dashboard (live SSE)
│   │   │   ├── units/            Unit lifecycle management
│   │   │   ├── donors/           Donor search, health records
│   │   │   ├── camps/            Camp applications, approval queue
│   │   │   ├── requisitions/     Requisition queue, issue flow
│   │   │   ├── admin/            User management, master data, audit
│   │   │   └── public/           Unauthenticated stock view
│   │   ├── components/
│   │   │   ├── ui/               shadcn/ui generated components
│   │   │   ├── ProtectedRoute.tsx  Role-based route guard
│   │   │   └── ...               Domain components
│   │   ├── context/
│   │   │   └── AuthContext.tsx   JWT decode, role extraction, refresh logic
│   │   ├── hooks/
│   │   │   ├── useStock.ts       TanStack Query hooks for stock data + SSE
│   │   │   └── ...               Per-domain query/mutation hooks
│   │   ├── api/
│   │   │   └── client.ts         Axios instance with auth interceptor
│   │   └── lib/
│   │       └── rbac.ts           Role → permitted routes/actions map
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── mobile/                       Flutter app (donor + camp capture)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app/
│   │   │   ├── router.dart       go_router route definitions + auth guard
│   │   │   └── theme.dart
│   │   ├── features/
│   │   │   ├── auth/             Login, token storage (flutter_secure_storage)
│   │   │   ├── donor/            Registration, ABHA verify, health records
│   │   │   ├── screening/        Vitals, questionnaire, eligibility
│   │   │   ├── camp/             Camp listing, pre-allocation fetch
│   │   │   ├── barcode/          QR render (qr_flutter), scan (mobile_scanner)
│   │   │   └── sync/             Offline queue, sync manager, conflict display
│   │   ├── data/
│   │   │   ├── local/            sqflite schema + DAOs (offline storage)
│   │   │   └── remote/           Dio HTTP client + API services
│   │   └── shared/               Common widgets, models, utils
│   ├── android/
│   ├── ios/
│   ├── pubspec.yaml
│   └── .env.example              Base URL, feature flags for Flutter
│
├── infra/
│   ├── docker-compose.yml        Local: API + Postgres + Redis + pgAdmin
│   ├── docker-compose.test.yml   Test environment
│   ├── nginx/                    Reverse proxy config (staging/prod)
│   └── .env.example
│
└── docs/
    ├── RAKT_Durg_BRD.md
    ├── RAKT_Durg_TRD.md
    ├── RAKT_Durg_Proposal.md
    ├── IMPLEMENTATION_PLAN.md    (this file)
    └── adr/
        ├── ADR-001-redis-celery.md
        ├── ADR-002-sse-realtime.md
        ├── ADR-003-barcode-preallocation.md
        ├── ADR-004-isbt128-id-scheme.md
        └── ADR-005-flutter-over-react-native.md
```

### 2.1 Web RBAC Route Map

```
Route                         Required roles
/dashboard                    admin, medical_officer, lab_tech, inventory_officer, phlebotomist
/units/*                      admin, medical_officer, lab_tech, inventory_officer, phlebotomist
/units/*/release              medical_officer, admin
/donors/*                     admin, medical_officer, lab_tech, phlebotomist
/camps/approval               admin, medical_officer
/camps/apply                  organizer
/requisitions/*               admin, medical_officer, inventory_officer
/admin/*                      admin
/audit                        admin, medical_officer
/public/stock                 (no auth — citizen_read)
```

`<ProtectedRoute roles={[...]}>` wraps each route subtree in the React Router definition. If the decoded JWT role is not in the allowed list, the user is redirected to `/unauthorized`. The role is read once from the JWT payload on login and stored in `AuthContext`; no extra API call is needed for route checks.

---

## 3. Full Data Model

All tables use `UUID` primary keys (server-generated via `gen_random_uuid()`) unless noted otherwise. Every table has `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`. Write-mutable tables also have `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` maintained by a `BEFORE UPDATE` trigger. The `audit_logs` table is **append-only** and has neither column.

Enums are defined as PostgreSQL `CREATE TYPE` to enforce data integrity at the DB layer. SQLAlchemy maps to these types.

### 3.1 Reference / Master Data

```sql
-- ── Enums ─────────────────────────────────────────────────────────────────

CREATE TYPE blood_group_enum AS ENUM (
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
);

CREATE TYPE sex_enum AS ENUM ('M', 'F', 'O');

CREATE TYPE component_type_enum AS ENUM (
  'whole_blood', 'prbc', 'platelets', 'ffp', 'cryo', 'granulocytes'
);

CREATE TYPE unit_lifecycle_state AS ENUM (
  'collected', 'tested', 'separated', 'stored',
  'reserved', 'issued', 'transfused', 'discarded', 'expired'
);

CREATE TYPE unit_release_status AS ENUM (
  'pending', 'released', 'rejected', 'quarantine'
);

CREATE TYPE component_state_enum AS ENUM (
  'available', 'reserved', 'issued', 'transfused', 'discarded', 'expired'
);

CREATE TYPE test_result_enum AS ENUM (
  'reactive', 'non_reactive', 'indeterminate'
);

CREATE TYPE eligibility_result_enum AS ENUM (
  'eligible', 'temporarily_deferred', 'permanently_deferred'
);

CREATE TYPE camp_status_enum AS ENUM (
  'draft', 'submitted', 'under_review', 'approved',
  'rejected', 'cancelled', 'completed'
);

CREATE TYPE requisition_status_enum AS ENUM (
  'pending', 'partially_reserved', 'fully_reserved',
  'partially_issued', 'issued', 'cancelled'
);

CREATE TYPE requisition_priority_enum AS ENUM (
  'routine', 'urgent', 'emergency'
);

CREATE TYPE ledger_reason_enum AS ENUM (
  'collection', 'reserve', 'unreserve', 'issue',
  'transfused', 'discard', 'expiry', 'transfer_in', 'transfer_out', 'adjustment'
);

CREATE TYPE wallet_txn_type_enum AS ENUM (
  'earn', 'redeem', 'expire', 'adjust'
);

CREATE TYPE notification_channel_enum AS ENUM ('whatsapp', 'sms', 'in_app');

CREATE TYPE notification_status_enum AS ENUM (
  'pending', 'sent', 'delivered', 'failed'
);

CREATE TYPE audit_actor_type AS ENUM ('user', 'system', 'sync_agent');

CREATE TYPE sync_status_enum AS ENUM (
  'pending', 'processed', 'conflict', 'error'
);

CREATE TYPE donor_status_enum AS ENUM (
  'active', 'temporarily_deferred', 'permanently_deferred'
);

-- ── Facilities ─────────────────────────────────────────────────────────────

CREATE TABLE facilities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  facility_code VARCHAR(10)  NOT NULL UNIQUE,  -- used in barcode ID scheme
  type          VARCHAR(50)  NOT NULL,          -- 'blood_bank', 'hospital', 'camp_site'
  address       TEXT,
  district      VARCHAR(100),
  state         VARCHAR(100) NOT NULL DEFAULT 'Chhattisgarh',
  phone         VARCHAR(20),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 3.2 Users & RBAC

```sql
CREATE TYPE user_role_enum AS ENUM (
  'admin',
  'medical_officer',
  'lab_tech',
  'phlebotomist',
  'inventory_officer',
  'organizer',
  'donor',
  'citizen_read'
);

CREATE TABLE users (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id     UUID           REFERENCES facilities(id),  -- null for organizers/donors
  role            user_role_enum NOT NULL,
  username        VARCHAR(100)   NOT NULL UNIQUE,
  email           VARCHAR(200)   UNIQUE,
  phone           VARCHAR(20),
  hashed_password VARCHAR(200)   NOT NULL,
  display_name    VARCHAR(200),
  is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 of the raw token
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

### 3.3 Donors

```sql
CREATE TABLE donors (
  id                        UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity
  name                      VARCHAR(200)      NOT NULL,
  date_of_birth             DATE,
  age_years                 SMALLINT,         -- captured if DOB unknown
  sex                       sex_enum,
  -- Contact
  contact_phone             VARCHAR(20)       NOT NULL,
  address                   TEXT,
  -- ABHA (never raw Aadhaar)
  abha_reference            VARCHAR(100),     -- masked ABHA health ID reference
  abha_verified             BOOLEAN           NOT NULL DEFAULT FALSE,
  -- Medical
  blood_group               blood_group_enum,
  status                    donor_status_enum NOT NULL DEFAULT 'active',
  -- Consent (DPDP)
  consent_given             BOOLEAN           NOT NULL DEFAULT FALSE,
  consent_timestamp         TIMESTAMPTZ,
  consent_purpose           TEXT,
  -- Meta
  registered_at_facility_id UUID              REFERENCES facilities(id),
  created_by                UUID              REFERENCES users(id),
  created_at                TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_donors_phone ON donors(contact_phone);
CREATE INDEX idx_donors_abha  ON donors(abha_reference) WHERE abha_reference IS NOT NULL;

CREATE TABLE organizers (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL UNIQUE REFERENCES users(id),
  org_name      VARCHAR(200) NOT NULL,
  org_type      VARCHAR(50),  -- 'ngo', 'college', 'industry', 'govt', 'other'
  contact_name  VARCHAR(200),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(200),
  address       TEXT,
  is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 3.4 Screening & Donation

```sql
CREATE TABLE screenings (
  id                    UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id              UUID                    NOT NULL REFERENCES donors(id),
  camp_id               UUID,                   -- FK added after camps table; NULL = walk-in
  screened_by           UUID                    REFERENCES users(id),
  screening_datetime    TIMESTAMPTZ             NOT NULL,
  -- Vitals
  weight_kg             DECIMAL(5,2),
  bp_systolic           SMALLINT,
  bp_diastolic          SMALLINT,
  pulse_bpm             SMALLINT,
  temperature_celsius   DECIMAL(4,1),
  hemoglobin_g_dl       DECIMAL(4,1),
  -- Questionnaire (schema defined in app, not DB)
  questionnaire         JSONB                   NOT NULL DEFAULT '{}',
  -- Eligibility
  eligibility_result    eligibility_result_enum NOT NULL,
  deferral_reason       VARCHAR(500),
  deferral_until        DATE,
  -- Offline sync
  captured_offline      BOOLEAN                 NOT NULL DEFAULT FALSE,
  device_id             VARCHAR(100),
  sync_id               UUID,                   -- client-generated idempotency key
  synced_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_screenings_donor    ON screenings(donor_id);
CREATE UNIQUE INDEX idx_screenings_sync ON screenings(sync_id) WHERE sync_id IS NOT NULL;

CREATE TABLE donations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id            UUID        NOT NULL REFERENCES donors(id),
  screening_id        UUID        NOT NULL REFERENCES screenings(id),
  camp_id             UUID,       -- FK added after camps table
  facility_id         UUID        NOT NULL REFERENCES facilities(id),
  collected_by        UUID        REFERENCES users(id),
  collection_datetime TIMESTAMPTZ NOT NULL,
  donation_type       VARCHAR(20) NOT NULL DEFAULT 'voluntary',
  volume_ml           SMALLINT,
  -- Offline sync
  captured_offline    BOOLEAN     NOT NULL DEFAULT FALSE,
  sync_id             UUID,
  synced_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE UNIQUE INDEX idx_donations_sync ON donations(sync_id) WHERE sync_id IS NOT NULL;
```

### 3.5 Blood Units, Components & Testing

```sql
-- Barcode ID scheme (ISBT 128–compatible design):
--   Format: RD + [6-char facility_code] + [6-digit sequence] + [1-char Luhn check]
--   Example: RDRKDUR000042C  (15 chars)
--   Sequence is drawn from barcode_sequences table with an advisory lock.
--   When ISBT 128 is formally adopted, facility_code is replaced with the
--   ICCBBA-registered facility identifier.

CREATE TABLE blood_units (
  id                UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode           VARCHAR(20)          NOT NULL UNIQUE,
  donation_id       UUID                 NOT NULL REFERENCES donations(id),
  blood_group       blood_group_enum     NOT NULL,
  facility_id       UUID                 NOT NULL REFERENCES facilities(id),
  collection_datetime TIMESTAMPTZ        NOT NULL,
  expiry_datetime   TIMESTAMPTZ          NOT NULL,
  release_status    unit_release_status  NOT NULL DEFAULT 'pending',
  lifecycle_state   unit_lifecycle_state NOT NULL DEFAULT 'collected',
  discarded_reason  TEXT,
  created_by        UUID                 REFERENCES users(id),
  created_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_units_barcode  ON blood_units(barcode);
CREATE INDEX idx_units_donation ON blood_units(donation_id);
CREATE INDEX idx_units_state    ON blood_units(lifecycle_state);
CREATE INDEX idx_units_expiry   ON blood_units(expiry_datetime)
  WHERE lifecycle_state NOT IN ('issued','transfused','discarded','expired');

CREATE TABLE test_results (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id           UUID             NOT NULL REFERENCES blood_units(id),
  test_panel        VARCHAR(50)      NOT NULL,  -- 'HIV','HBsAg','HCV','VDRL','Malaria','BG_Confirm'
  result            test_result_enum NOT NULL,
  tested_by         UUID             REFERENCES users(id),
  tested_datetime   TIMESTAMPTZ      NOT NULL,
  released_by       UUID             REFERENCES users(id),
  released_datetime TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE (unit_id, test_panel)
);
CREATE INDEX idx_test_results_unit ON test_results(unit_id);

CREATE TABLE components (
  id              UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         UUID                 NOT NULL REFERENCES blood_units(id),
  type            component_type_enum  NOT NULL,
  volume_ml       SMALLINT,
  blood_group     blood_group_enum     NOT NULL,
  expiry_datetime TIMESTAMPTZ          NOT NULL,
  state           component_state_enum NOT NULL DEFAULT 'available',
  facility_id     UUID                 NOT NULL REFERENCES facilities(id),
  discarded_reason TEXT,
  created_by      UUID                 REFERENCES users(id),
  created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
-- Partial index used by every FEFO query
CREATE INDEX idx_components_fefo  ON components(blood_group, type, expiry_datetime)
  WHERE state = 'available';
CREATE INDEX idx_components_unit  ON components(unit_id);
CREATE INDEX idx_components_state ON components(state);
```

### 3.6 Camp Management

```sql
CREATE TABLE camps (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id      UUID             NOT NULL REFERENCES organizers(id),
  host_facility_id  UUID             NOT NULL REFERENCES facilities(id),
  camp_name         VARCHAR(200),
  requested_date    DATE             NOT NULL,
  location          VARCHAR(300)     NOT NULL,
  expected_donors   SMALLINT,
  status            camp_status_enum NOT NULL DEFAULT 'draft',
  coupon_prefix     VARCHAR(10),     -- set on approval, e.g. 'RDCP240'
  approved_by       UUID             REFERENCES users(id),
  approval_datetime TIMESTAMPTZ,
  rejection_reason  TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_camps_organizer ON camps(organizer_id);
CREATE INDEX idx_camps_date      ON camps(requested_date);
-- Calendar blocking: only one active camp per facility per date
CREATE UNIQUE INDEX idx_camps_facility_date
  ON camps(host_facility_id, requested_date)
  WHERE status IN ('submitted','under_review','approved');

CREATE TABLE camp_coupons (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id          UUID        NOT NULL REFERENCES camps(id),
  coupon_code      VARCHAR(20) NOT NULL UNIQUE,
  is_used          BOOLEAN     NOT NULL DEFAULT FALSE,
  used_by_donor_id UUID        REFERENCES donors(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_camp_coupons_camp ON camp_coupons(camp_id);

-- Deferred FK from screenings and donations to camps
ALTER TABLE screenings ADD CONSTRAINT fk_screenings_camp
  FOREIGN KEY (camp_id) REFERENCES camps(id);
ALTER TABLE donations ADD CONSTRAINT fk_donations_camp
  FOREIGN KEY (camp_id) REFERENCES camps(id);
```

### 3.7 Stock Ledger & Alerts

```sql
-- Append-only ledger; no updated_at
CREATE TABLE stock_ledger (
  id             UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id    UUID                NOT NULL REFERENCES facilities(id),
  blood_group    blood_group_enum    NOT NULL,
  component_type component_type_enum NOT NULL,
  change_qty     SMALLINT            NOT NULL,    -- positive or negative
  reason         ledger_reason_enum  NOT NULL,
  reference_id   UUID,
  reference_type VARCHAR(50),
  balance_after  SMALLINT            NOT NULL,
  recorded_by    UUID                REFERENCES users(id),
  recorded_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_lookup
  ON stock_ledger(facility_id, blood_group, component_type, recorded_at DESC);

CREATE TABLE alert_thresholds (
  id               UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id      UUID                NOT NULL REFERENCES facilities(id),
  blood_group      blood_group_enum    NOT NULL,
  component_type   component_type_enum NOT NULL,
  low_stock_qty    SMALLINT            NOT NULL DEFAULT 2,
  near_expiry_days SMALLINT            NOT NULL DEFAULT 3,
  updated_by       UUID                REFERENCES users(id),
  updated_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  UNIQUE (facility_id, blood_group, component_type)
);
```

### 3.8 Requisitions & Issue

```sql
CREATE TABLE requisitions (
  id                  UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id         UUID                      NOT NULL REFERENCES facilities(id),
  patient_name        VARCHAR(200),
  patient_hospital_id VARCHAR(100),
  blood_group         blood_group_enum          NOT NULL,
  component_type      component_type_enum       NOT NULL,
  units_requested     SMALLINT                  NOT NULL DEFAULT 1,
  priority            requisition_priority_enum NOT NULL DEFAULT 'routine',
  status              requisition_status_enum   NOT NULL DEFAULT 'pending',
  clinical_indication TEXT,
  requested_by        UUID                      REFERENCES users(id),
  requested_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  fulfilled_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_requisitions_status   ON requisitions(status);
CREATE INDEX idx_requisitions_priority ON requisitions(priority, requested_at);

CREATE TABLE issues (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id       UUID        NOT NULL REFERENCES requisitions(id),
  component_id         UUID        NOT NULL UNIQUE REFERENCES components(id),
  issued_by            UUID        REFERENCES users(id),
  issue_datetime       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transfusion_datetime TIMESTAMPTZ,
  transfused_by        UUID        REFERENCES users(id),
  outcome              VARCHAR(20), -- 'transfused', 'returned', 'discarded'
  outcome_notes        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_issues_requisition ON issues(requisition_id);
```

### 3.9 Barcode Pre-Allocation (Offline Camp Support)

```sql
CREATE TABLE barcode_sequences (
  facility_id UUID    PRIMARY KEY REFERENCES facilities(id),
  last_seq    INTEGER NOT NULL DEFAULT 0
  -- Incremented atomically via SELECT ... FOR UPDATE
);

CREATE TABLE barcode_allocations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id    UUID        NOT NULL REFERENCES facilities(id),
  allocated_to   UUID        REFERENCES users(id),
  camp_id        UUID        REFERENCES camps(id),
  sequence_start INTEGER     NOT NULL,
  sequence_end   INTEGER     NOT NULL,
  next_sequence  INTEGER     NOT NULL,  -- tracks offline usage
  allocated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fully_returned BOOLEAN     NOT NULL DEFAULT FALSE,
  returned_at    TIMESTAMPTZ
);
```

### 3.10 Wallet (Feature-Flagged — schema created, service layer enforces flag)

```sql
CREATE TABLE wallet_accounts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id   UUID        NOT NULL UNIQUE REFERENCES donors(id),
  balance    SMALLINT    NOT NULL DEFAULT 0 CHECK (balance >= 0),
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id                   UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id            UUID                 NOT NULL REFERENCES wallet_accounts(id),
  type                 wallet_txn_type_enum NOT NULL,
  amount               SMALLINT             NOT NULL CHECK (amount > 0),
  balance_after        SMALLINT             NOT NULL,
  reference_type       VARCHAR(50),
  reference_id         UUID,
  beneficiary_donor_id UUID                 REFERENCES donors(id),
  expiry_date          DATE,
  notes                TEXT,
  recorded_by          UUID                 REFERENCES users(id),
  recorded_at          TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallet_txn_wallet ON wallet_transactions(wallet_id, recorded_at DESC);

CREATE TABLE wallet_family_links (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_donor_id     UUID        NOT NULL REFERENCES donors(id),
  beneficiary_donor_id UUID        NOT NULL REFERENCES donors(id),
  relationship         VARCHAR(50),
  is_verified          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (primary_donor_id, beneficiary_donor_id)
);
```

### 3.11 Notifications

```sql
CREATE TABLE notifications (
  id                  UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id   UUID                      REFERENCES users(id),
  recipient_donor_id  UUID                      REFERENCES donors(id),
  channel             notification_channel_enum NOT NULL,
  template_name       VARCHAR(100)              NOT NULL,
  payload             JSONB                     NOT NULL DEFAULT '{}',
  status              notification_status_enum  NOT NULL DEFAULT 'pending',
  provider_message_id VARCHAR(200),
  sent_at             TIMESTAMPTZ,
  error_detail        TEXT,
  celery_task_id      VARCHAR(200),
  created_at          TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_pending
  ON notifications(status) WHERE status IN ('pending','failed');
```

### 3.12 Offline Sync Queue

```sql
CREATE TABLE sync_queue (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       VARCHAR(100)     NOT NULL,
  entity_type     VARCHAR(50)      NOT NULL,  -- 'screening', 'donation'
  sync_id         UUID             NOT NULL UNIQUE,
  payload         JSONB            NOT NULL,
  status          sync_status_enum NOT NULL DEFAULT 'pending',
  conflict_reason TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sync_pending ON sync_queue(status) WHERE status = 'pending';
```

### 3.13 Audit Log

```sql
-- Append-only. No updated_at. Modification blocked by rules below.
CREATE TABLE audit_logs (
  id           BIGSERIAL        PRIMARY KEY,
  actor_id     UUID,
  actor_type   audit_actor_type NOT NULL,
  action       VARCHAR(100)     NOT NULL,   -- 'unit.state_change', 'donor.pii_read', etc.
  entity_type  VARCHAR(50)      NOT NULL,
  entity_id    UUID             NOT NULL,
  before_state JSONB,
  after_state  JSONB,
  ip_address   INET,
  user_agent   TEXT,
  request_id   VARCHAR(100),
  timestamp    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity    ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor     ON audit_logs(actor_id, timestamp DESC);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
```

### 3.14 Feature Flags

```sql
CREATE TABLE feature_flags (
  id          SMALLSERIAL  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  is_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_by  UUID         REFERENCES users(id),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags (name, is_enabled, description) VALUES
  ('wallet_enabled', FALSE,
   'Blood Credit Wallet. Requires clinical/legal sign-off (BRULE-06) before enabling in any non-dev environment.');
```

### 3.15 Entity Relationship Summary

```
facilities ──< users
           ──< donations ──< blood_units ──< test_results
                         ──< components (expiry-indexed for FEFO)

donors ──< screenings
       ──< donations
       ──< wallet_accounts ──< wallet_transactions
       ──< wallet_family_links

organizers ──< camps ──< camp_coupons
                    ──< (linked) screenings, donations

requisitions ──< issues >──< components

audit_logs   — references any entity via (entity_type, entity_id)
sync_queue   — processed records map to screenings/donations via sync_id
barcode_allocations — references facility + user + camp
```

---

## 4. Phase-by-Phase Implementation Plan

---

### Phase 0 — Foundations
**Duration estimate:** 1.5–2 weeks  
**Goal:** Running infrastructure, full schema, auth, RBAC, audit middleware, seed data, CI.

#### Tasks

| # | Task | Key files |
|---|---|---|
| 0.1 | Initialise monorepo — `pyproject.toml` (ruff, mypy, pytest), web `package.json`, Flutter `pubspec.yaml` | Root config |
| 0.2 | `docker-compose.yml` — FastAPI + PostgreSQL 16 + Redis 7 + pgAdmin | `infra/` |
| 0.3 | FastAPI skeleton — `main.py`, `config.py` (pydantic-settings), `GET /health` | `backend/app/` |
| 0.4 | SQLAlchemy 2 async engine + session `Depends` | `database.py` |
| 0.5 | All ORM models (§3) + `alembic init` + initial migration | `models/`, `alembic/` |
| 0.6 | Feature flag seed insert (`wallet_enabled = FALSE`) | migration |
| 0.7 | Auth router: `POST /auth/token`, `POST /auth/refresh`, `POST /auth/logout` | `routers/auth.py` |
| 0.8 | JWT creation/validation; `require_role(...)` dependency factory | `middleware/rbac.py` |
| 0.9 | Audit-log middleware — every write request logs actor / action / entity / before / after | `middleware/audit.py` |
| 0.10 | Celery app + Redis broker; beat schedule placeholder | `tasks/celery_app.py` |
| 0.11 | Synthetic seed script — facilities, one user per role, fake donors (no real PII) | `seed/seed.py` |
| 0.12 | Pytest fixtures — isolated test DB, per-role auth headers | `tests/conftest.py` |
| 0.13 | Tests: login/refresh/logout, role-permission matrix, audit entry written on a write | `tests/test_auth.py` |
| 0.14 | GitHub Actions CI — ruff lint, mypy, pytest, alembic migration check | `.github/workflows/ci.yml` |
| 0.15 | ADR-001 through ADR-005 | `docs/adr/` |

#### Acceptance Criteria (Phase 0)

- [ ] `docker-compose up` → `GET /health` returns `200`.
- [ ] `alembic upgrade head` applies cleanly on a fresh database.
- [ ] `POST /auth/token` with valid credentials returns a signed JWT.
- [ ] A request with a valid JWT but wrong role returns `403`.
- [ ] A write operation inserts a row in `audit_logs` with the correct actor, action, and entity.
- [ ] `SELECT is_enabled FROM feature_flags WHERE name='wallet_enabled'` returns `false`.
- [ ] Seed script runs with no errors and leaves no real PII in any column.
- [ ] All tests pass in CI.

---

### Phase 1 — Blood Unit Tracking + Live Stock Dashboard
**Depends on:** Phase 0 approved  
**Requirement IDs:** BR-UNIT-01–07, BR-DASH-01–04  
**Duration estimate:** 2 weeks

#### Tasks

| # | Task |
|---|---|
| 1.1 | Barcode generation service — ISBT 128–compatible ID scheme; internal `POST /barcodes/generate` |
| 1.2 | `POST /units` — create unit from donation, assign barcode, set state `collected`, audit |
| 1.3 | `GET /units/{barcode}` — scan lookup: group, component list, test status, expiry, donor linkage (BR-UNIT-02) |
| 1.4 | `PATCH /units/{id}/state` — lifecycle state machine; enforce valid transitions; audit every change |
| 1.5 | `POST /units/{id}/tests` — record TTI panel results (lab_tech role) |
| 1.6 | `PATCH /units/{id}/release` — medical officer releases unit; sets `release_status = released` |
| 1.7 | `POST /units/{id}/components` — component separation; parent unit moves to `separated`; each component inserted with its own expiry |
| 1.8 | `core/fefo.py` — FEFO reservation using the partial index on `components`; returns earliest-expiry available unit |
| 1.9 | Stock ledger service — every component state change posts a ledger entry; `balance_after` is computed atomically with `SELECT FOR UPDATE` |
| 1.10 | Postgres `LISTEN/NOTIFY` trigger on `stock_ledger` insert |
| 1.11 | `GET /stock` (auth) + `GET /public/stock` (no auth, BR-DASH-02) — current stock by group × component |
| 1.12 | `GET /stream/stock` — SSE endpoint; subscribes to `LISTEN/NOTIFY` channel; emits `stock_update` events |
| 1.13 | `GET /units/{id}/lookback` — trace all units/components from a donor or flagged result (BR-UNIT-07) |
| 1.14 | Expiry sweeper Celery beat task — hourly; marks expired components; posts ledger entries |
| 1.15 | Alert service — evaluates thresholds; returns low-stock + near-expiry alert list |
| 1.16 | **React web** — stock dashboard page: table by group × component, SSE-driven live update (TanStack Query + SSE hook), low-stock/near-expiry badges |
| 1.17 | **React web** — public stock view (unauthenticated `/public/stock` route, `citizen_read` effectively) |
| 1.18 | Unit tests: state machine transitions (valid + invalid), FEFO ordering, audit entries on every state change, lookback trace, public endpoint returns no PII |

#### Acceptance Criteria (Phase 1)

- [ ] A unit traverses `collected → tested → separated → stored → reserved → issued → transfused` via API; each step writes an `audit_log` entry.
- [ ] Skipping a state (e.g., `collected → issued`) returns `422`.
- [ ] `GET /units/{barcode}` returns group, component list, test status, expiry, donor ID.
- [ ] After separation, `GET /public/stock` reflects correct counts within 1 second (SSE test).
- [ ] FEFO: two available PRBC units with different expiry dates — the query returns the earlier-expiry unit.
- [ ] Expiry sweeper marks an overdue component `expired` and posts a ledger entry.
- [ ] All tests pass.

---

### Phase 2 — Donor Management + Paperless Screening (Offline)
**Depends on:** Phase 1 approved  
**Requirement IDs:** BR-DON-01–08  
**Duration estimate:** 2.5–3 weeks

#### Tasks

| # | Task |
|---|---|
| 2.1 | `POST /donors`, `GET /donors/{id}`, `GET /donors/{id}/health-records` (PII read → audit) |
| 2.2 | `adapters/abha.py` — `AbhaAdapter` interface + `MockAbhaAdapter` returning canned results |
| 2.3 | `POST /identity/abha/verify` — calls adapter; stores `abha_reference` (masked), never raw Aadhaar |
| 2.4 | `core/eligibility.py` — configurable rules engine: 90-day interval, age 18–65, weight ≥45 kg, Hb ≥12.5 g/dL, deferral list → `EligibilityResult` |
| 2.5 | `POST /donors/{id}/screenings` — vitals + questionnaire + eligibility result |
| 2.6 | `POST /donors/{id}/donations` (requires eligible screening) |
| 2.7 | `POST /barcodes/pre-allocate` (phlebotomist role) — reserves N barcodes for a camp/device |
| 2.8 | `POST /units` extended — accepts `allocation_id` + sequence offset for offline-assigned barcodes |
| 2.9 | `POST /sync/batch` — processes `[{sync_id, entity_type, payload}]` idempotently; conflict detection (same donor + datetime within 2 hours) |
| 2.10 | `GET /sync/conflicts` (medical_officer role) — list conflicts for review |
| 2.11 | **Flutter** — sqflite schema mirroring screenings + donations; offline screening form (vitals, questionnaire, eligibility gate) |
| 2.12 | **Flutter** — barcode assignment from pre-allocated batch; renders QR with `qr_flutter`; on-screen print trigger |
| 2.13 | **Flutter** — `mobile_scanner` integration for scanning existing unit barcodes |
| 2.14 | **Flutter** — sync manager: queues offline records in sqflite; retries on connectivity restore; displays sync status per record |
| 2.15 | **Flutter** — donor health record view (read-only, post-sync) |
| 2.16 | Tests: eligibility all deferral branches, sync idempotency (duplicate sync_id → one record), conflict detection, barcode pre-allocation exhaustion, ABHA mock paths |

#### Acceptance Criteria (Phase 2)

- [ ] A donor is registered, ABHA-verified (mock), screened eligible, issued a barcode, and a blood unit is traceable via `GET /units/{barcode}`.
- [ ] A donor with Hb below threshold receives `temporarily_deferred` with a reason.
- [ ] A phlebotomist pre-allocates 20 barcodes offline; Flutter assigns them sequentially.
- [ ] Syncing the same `sync_id` twice creates only one record (idempotency).
- [ ] Two screenings for the same donor within 90 minutes are flagged as a conflict in `sync_queue`.
- [ ] `GET /donors/{id}/health-records` writes an audit entry.
- [ ] All tests pass.

---

### Phase 3 — Camp Management + Approval
**Depends on:** Phase 2 approved  
**Requirement IDs:** BR-CAMP-01–06, BRULE-05  
**Duration estimate:** 1.5 weeks

#### Tasks

| # | Task |
|---|---|
| 3.1 | Organizer registration — `POST /organizers`; `organizer` role in RBAC |
| 3.2 | `POST /camps` — organizer submits application; calendar-blocking unique index enforced |
| 3.3 | Camp state machine: `submitted → under_review → approved / rejected` via `PATCH /camps/{id}/review`, `/approve`, `/reject` |
| 3.4 | On approval: generate configurable number of `camp_coupons`; return codes |
| 3.5 | `GET /organizers/{id}/camps` — history with per-camp unit count aggregate |
| 3.6 | `GET /camps/{id}` — full detail: linked screenings, donations, units |
| 3.7 | `GET /camps/calendar` — blocked dates (no auth) |
| 3.8 | **React web** — camp application form (organizer role); approval queue with approve/reject actions (medical_officer role); coupon display; calendar view |
| 3.9 | Tests: calendar conflict, full approval workflow, coupons only on `approved` state, BRULE-05 |

#### Acceptance Criteria (Phase 3)

- [ ] Organizer submits → medical officer approves → coupons issued.
- [ ] A second camp on the same facility + date returns a calendar-conflict error.
- [ ] Approving a camp not in `under_review` state returns `422`.
- [ ] `GET /organizers/{id}/camps` shows unit count per camp.
- [ ] All tests pass.

---

### Phase 4 — Blood Credit Wallet (Feature-Flagged OFF)
**Depends on:** Phase 3 approved  
**Requirement IDs:** BR-WAL-01–05, BRULE-06  
**Duration estimate:** 1 week  
**Production gate:** `wallet_enabled` must remain `FALSE` in staging and production.

#### Tasks

| # | Task |
|---|---|
| 4.1 | Feature flag check middleware — any `/wallet/*` endpoint returns `503` if flag is `FALSE`; note in response: "Wallet requires clinical/legal sign-off (BRULE-06)" |
| 4.2 | `POST /wallet/{donor_id}/create` (admin only, flag-gated) |
| 4.3 | `POST /wallet/{donor_id}/credit` — earn on verified donation; audit every transaction |
| 4.4 | `POST /wallet/{donor_id}/redeem` — eligibility check (balance, family link, availability); audit |
| 4.5 | `POST /wallet/family-links`, `GET /wallet/{donor_id}/family` |
| 4.6 | `GET /wallet/{donor_id}` — balance + transaction history |
| 4.7 | Celery beat — credit expiry sweeper; writes `expire` transactions |
| 4.8 | CI gate: if `ENV=production` and `wallet_enabled=true` → fail deployment |
| 4.9 | Tests (flag `TRUE` in test config only): earn → redeem cycle, family redemption, expiry sweep, flag-off returns `503` |

#### Acceptance Criteria (Phase 4)

- [ ] With `wallet_enabled = FALSE`, all `/wallet/*` endpoints return `503`.
- [ ] With `wallet_enabled = TRUE` (dev/test), earn → redeem → expiry cycle works and every transaction is in `audit_logs`.
- [ ] Staging confirms flag is `FALSE` and wallet routes are unreachable.
- [ ] All tests pass.

---

### Phase 5 — Requisition + Notifications + e-RaktKosh Reconciliation
**Depends on:** Phase 4 approved  
**Requirement IDs:** BR-REQ-01–04, BR-NOT-01–02, BR-ADM-04  
**Duration estimate:** 2 weeks

#### Tasks

| # | Task |
|---|---|
| 5.1 | `POST /requisitions` — patient, group, component, priority |
| 5.2 | `POST /requisitions/{id}/reserve` — FEFO-based reservation; component → `reserved`; ledger entry |
| 5.3 | `POST /requisitions/{id}/issue` — component → `issued`; `issues` record; unit state update; ledger entry |
| 5.4 | `POST /issues/{id}/transfusion` — record outcome; completes donor → patient chain |
| 5.5 | Emergency queue: `GET /requisitions/queue` sorted by priority then age; SSE event on new emergency |
| 5.6 | `adapters/notification.py` — `NotificationAdapter` interface + `MockNotificationAdapter` (logs to stdout) |
| 5.7 | Celery tasks: post-donation health report (trigger: donation created + screening complete), requisition status, camp approval notification |
| 5.8 | `adapters/erakkosh.py` — `ERaktKoshAdapter` interface + `StubERaktKoshAdapter` writing dated JSON file; integration-point comment |
| 5.9 | `POST /admin/erakkosh/export` (admin role) — triggers export via adapter |
| 5.10 | Celery beat — daily export job |
| 5.11 | **React web** — requisition form; FEFO-suggested unit display; issue confirmation; emergency queue view |
| 5.12 | Tests: full requisition → issue → transfusion trace; FEFO respected; emergency priority; mock notification payload; export produces valid file |

#### Acceptance Criteria (Phase 5)

- [ ] A requisition is raised, a FEFO-selected component reserved, issued, and transfused; full chain auditable via barcode scan and requisition ID.
- [ ] An emergency requisition appears above a routine one placed earlier.
- [ ] Mock WhatsApp notification is logged with the correct payload.
- [ ] `POST /admin/erakkosh/export` produces a valid dated JSON file; no live e-RaktKosh API is called.
- [ ] All tests pass.

---

### Phase 6 — Hardening + Deployment
**Depends on:** Phase 5 approved  
**Requirement IDs:** BRD §12 compliance, BR-ADM-03  
**Duration estimate:** 2 weeks

#### Tasks

| # | Task |
|---|---|
| 6.1 | Security review — OWASP Top 10: SQL injection (ORM-only policy), XSS (React escaping), rate limiting on auth endpoints, CORS config |
| 6.2 | DPDP compliance: consent withdrawal `DELETE /donors/{id}/consent` (wipes PII fields, retains blood-bank records); retention/deletion job |
| 6.3 | Encryption — confirm DB-level or disk-level at-rest encryption in deployment; TLS at nginx |
| 6.4 | Backup — `pg_dump` daily + WAL archiving; tested restore runbook |
| 6.5 | DR — define RPO (≤1 hr data loss) and RTO (≤4 hr restore); document recovery procedure |
| 6.6 | Structured JSON logging with `request_id` correlation; log-level config per environment |
| 6.7 | Health-check + readiness probe endpoints; optional Prometheus metrics |
| 6.8 | Production docker-compose / deployment manifests for govt cloud; secrets via environment, never source |
| 6.9 | Staging deployment + full smoke test (unit scan, requisition, camp application) |
| 6.10 | Bilingual UI — Hindi/English toggle; all user-facing strings in `i18n` resource files (React + Flutter) |
| 6.11 | Compliance checklist — DPDP, no raw Aadhaar (DB grep), audit trail coverage, BRULE-06 wallet gate |

#### Acceptance Criteria (Phase 6)

- [ ] No raw Aadhaar value in any database row.
- [ ] Consent withdrawal clears PII; associated blood-unit records are retained.
- [ ] Staging deploys from a fresh migration; smoke tests pass.
- [ ] Security checklist signed off.
- [ ] Hindi UI renders without layout breaks.
- [ ] `wallet_enabled = FALSE` confirmed in staging.

---

## 5. Assumptions, Open Questions & Blockers

### 5.1 Assumptions

| # | Assumption |
|---|---|
| A1 | Single initial facility: District Hospital + Red Cross Blood Bank, Durg. |
| A2 | Medical questionnaire schema (questions + deferral scoring) to be provided by the Blood Bank Medical Officer before Phase 2 starts. Placeholder JSONB schema used in Phase 0. |
| A3 | Minimum donation interval is 90 days (NBTC guidance). Exact criteria confirmed by Medical Officer. |
| A4 | TTI panel: HIV, HBsAg, HCV, VDRL, Malaria. Final panel confirmed by Medical Officer. |
| A5 | WhatsApp health-report template content drafted and approved separately (Meta template approval: 2–5 business days). |
| A6 | ABDM sandbox credentials available for dev. Production ABHA access applied for separately. |
| A7 | e-RaktKosh integration is export-only for the initial release; no live bidirectional API assumed. |
| A8 | Bilingual Hindi/English only for MVP. |
| A9 | Hosting decision does not affect application code — Docker containers are portable. |
| A10 | Barcode label printer hardware available at the blood bank; exact label dimensions confirmed before Phase 1 closes. |

### 5.2 Open Questions (need answers before the relevant phase)

| # | Question | Needed by | Blocks |
|---|---|---|---|
| Q1 | What is the exact medical questionnaire used for donor deferral? | Before Phase 2 dev | Eligibility engine, Flutter screening form |
| Q2 | Precise deferral criteria beyond Hb/weight/age (travel, medication, illness history)? | Before Phase 2 dev | `core/eligibility.py` |
| Q3 | e-RaktKosh reconciliation format — CSV/XML/JSON accepted by State Blood Cell, or SFTP/REST API? | Before Phase 5 dev | `adapters/erakkosh.py` real implementation |
| Q4 | ABDM/ABHA production access timeline; does the project need to register as a Health Facility? | Before Phase 2 staging | ABHA adapter swap |
| Q5 | WhatsApp BSP selection (Meta Cloud API / Gupshup / Twilio)? | Before Phase 5 dev | Notification adapter |
| Q6 | SMS gateway provider? | Before Phase 5 dev | SMS adapter |
| Q7 | ISBT 128: will the blood bank apply for an ICCBBA facility code? | Before Phase 1 ships to production | Barcode scheme finalization |
| Q8 | Hosting infrastructure (NIC/MeghRaj VM specs, storage tier)? | Before Phase 6 | Deployment config |
| Q9 | Wallet earn/redeem rules (earn ratio, family eligibility, credit expiry period)? | Before wallet flag ever enabled in non-dev | Phase 4 rule config |
| Q10 | Retention period for donor health records under DPDP + Drugs & Cosmetics Rules (likely 5–10 years)? | Before Phase 6 compliance pass | Retention/deletion job |

### 5.3 Decisions Defaulted (will proceed unless redirected)

| # | Decision | Default |
|---|---|---|
| D1 | Flutter state management | Riverpod (over BLoC/Provider — cleaner async patterns) |
| D2 | Mobile barcode print path | Flutter generates QR on-screen; staff photographs / print driver out of scope for MVP |
| D3 | Hemoglobin device integration | Manual entry; hardware integration is out of scope per BRD §14 |
| D4 | Offline sync trigger | Manual "Sync Now" button with visible per-record status indicator |

---

## 6. Risk Register (Technical)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ABDM sandbox instability delays Phase 2 | Medium | Medium | Mock adapter lets Phase 2 proceed; swap at staging |
| Unused pre-allocated barcodes (device lost) | Low | Medium | Admin endpoint to reclaim allocations; auto-expire after 30 days |
| Postgres LISTEN/NOTIFY under high SSE client load | Low | Medium | Redis pub/sub fallback if > 50 concurrent dashboard connections |
| Wallet flag accidentally enabled in production | Low | High | CI fails deploy if `ENV=production` and `wallet_enabled=true` |
| e-RaktKosh export format unknown until Phase 5 | High | Medium | Extensible adapter; stub exports NDHM-style JSON by default |

---

*End of Implementation Plan. Awaiting approval before any application code is written.*
