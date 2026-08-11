# RAKT Durg — Claude Code Build Prompt

> Paste this as your initial instruction to Claude Code (or save it as `CLAUDE.md` at the repo root and start with *"Read CLAUDE.md and the /docs folder, then produce the implementation plan."*). Place `RAKT_Durg_BRD.md` and `RAKT_Durg_TRD.md` in a `/docs` folder in the repo first.

---

## Context & Mission

You are building **RAKT Durg**, a district-level digital blood bank platform for the Durg District Hospital & Red Cross Blood Bank (a real government healthcare project by Durg District Administration + IIT Bhilai). It digitizes the blood supply chain: donor screening, barcode-based unit tracking, camp management, requisition, and a real-time stock dashboard. It **complements the national e-RaktKosh system, not replaces it.**

Full requirements are in `/docs/RAKT_Durg_BRD.md` (business) and `/docs/RAKT_Durg_TRD.md` (technical). Requirement IDs like `BR-UNIT-02` refer to the BRD.

## How you must operate

### 1. PLAN FIRST — do not write application code yet

Before scaffolding anything:

1. Read `/docs/RAKT_Durg_BRD.md` and `/docs/RAKT_Durg_TRD.md` in full.
2. Produce a written **implementation plan** (in `/docs/IMPLEMENTATION_PLAN.md`) containing:
   - Confirmed architecture and technology stack (flag any better alternative to the TRD's choices, with reasoning).
   - Proposed repository/monorepo structure.
   - The full data model as concrete schema (tables, columns, keys, relationships).
   - A phase-by-phase task breakdown (using the phases below), each phase listing tasks, deliverables, and acceptance criteria.
   - Any assumptions and open questions that block work.
3. **Stop and wait for my approval of the plan.** Do not create application code until I approve.

### 2. Build phase-by-phase, with checkpoints

Once the plan is approved, implement **one phase at a time**. At the end of each phase:
- Summarize what was built and how it maps to the requirement IDs.
- Confirm the acceptance criteria are met and tests pass.
- **Stop and wait for my go-ahead before starting the next phase.**

Never jump ahead to a later phase or implement out-of-scope features without asking.

## Reference tech stack (confirm in the plan; substitute only with reason)

- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic migrations.
- **Database:** PostgreSQL.
- **Admin/staff web:** React.
- **Mobile (donor + offline camp capture):** React Native (Expo), local SQLite for offline.
- **Auth:** JWT (access/refresh) + role-based access control.
- **Barcode:** Code128/QR for MVP, ID scheme designed to be ISBT 128–compatible.
- **Containerization:** Docker + docker-compose for local dev.

## Repository structure (proposed)

```
/backend      FastAPI service, models, migrations, tests
/web          React admin/staff dashboard
/mobile       React Native app (donor + camp capture)
/infra        docker-compose, CI, deployment config
/docs         BRD, TRD, IMPLEMENTATION_PLAN, ADRs
```

## Phase plan

Implement in this order. **Phase 4 (wallet) is policy-gated** and must ship disabled behind a feature flag.

**Phase 0 — Foundations**
- Repo, tooling, linting, CI, docker-compose (API + Postgres).
- Full DB schema + Alembic migrations for the core data model.
- Auth + RBAC skeleton (roles: admin, medical_officer, lab_tech, phlebotomist, inventory_officer, organizer, donor, citizen_read).
- **Audit-log middleware** — every write and every PII read records actor/action/entity/before/after/timestamp.
- Synthetic seed data (see guardrails — **no real PII**).
- *Acceptance:* API boots, migrations apply, auth works, audit entries are written, tests pass.

**Phase 1 — Blood unit tracking + live stock dashboard** *(BR-UNIT-*, BR-DASH-*)*
- Unit lifecycle states (collected → tested → separated → stored → reserved → issued → transfused / discarded / expired).
- Barcode generation + scan lookup returning group, component, test status, expiry, donor linkage.
- Components (WholeBlood/PRBC/Platelets/FFP) and stock ledger with **FEFO**.
- Web dashboard: real-time stock by group/component + low-stock/near-expiry alerts + a **public read-only** stock view.
- *Acceptance:* a unit can be created, scanned, and traced through its lifecycle; stock reflects changes in real time; FEFO enforced.

**Phase 2 — Donor management + paperless screening (offline)** *(BR-DON-*)*
- Donor registration; ABHA verification via an **adapter with a mock/sandbox implementation**.
- Vitals/hemoglobin capture; digital medical questionnaire; eligibility/deferral rules.
- Barcode issued at collection, linked to donor + donation.
- **Offline-first** camp-capture flow with sync + conflict resolution (server authoritative; flag duplicate donor+time).
- Donor health-record history.
- *Acceptance:* a donor can be screened and issued a barcode **offline**, and it reconciles correctly on sync.

**Phase 3 — Camp management + approval** *(BR-CAMP-*)*
- Organizer camp application; calendar blocking; approval workflow (submit→review→approve/reject with reason); digital coupons; organizer history.
- *Acceptance:* a camp can be applied for, approved, and coupons issued; a date can't be confirmed without approval.

**Phase 4 — Blood Credit Wallet — FEATURE-FLAGGED OFF** *(BR-WAL-*)*
- Wallet account; earn on verified donation; redeem toward self/family (rules configurable); expiry; audit every txn; family linkage.
- **Must be behind a feature flag, disabled by default in all non-dev environments.** Add a clear note that enabling in production requires clinical/legal sign-off (BRULE-06).
- *Acceptance:* wallet logic works in dev with the flag on; with the flag off, no wallet endpoints/UI are reachable.

**Phase 5 — Requisition + notifications + e-RaktKosh reconciliation** *(BR-REQ-*, BR-NOT-*, BR-ADM-04)*
- Requisition → reserve → issue with traceability + emergency priority.
- WhatsApp/SMS via an **adapter with a mock implementation** (real BSP wired later).
- e-RaktKosh reconciliation/export via an **adapter** (export format; **no assumed live API** — leave the real channel as a documented integration point).
- *Acceptance:* a requisition can be fulfilled and traced; notifications and export run through their adapters (mock in dev).

**Phase 6 — Hardening + deployment**
- Security review, DPDP compliance pass (consent, retention/deletion, encryption at rest/in transit, data residency), DR/backup, deployment config for govt cloud.
- *Acceptance:* security/compliance checklist complete; deploys cleanly to staging.

## Engineering standards

- Typed everywhere (Pydantic v2 models; typed function signatures).
- Migrations for every schema change (never edit the DB by hand).
- Tests for business logic each phase; don't mark a phase done without them.
- Clear error handling; structured logging; meaningful commit messages.
- Small, reviewable changes; explain non-obvious decisions in an ADR under `/docs`.

## Hard guardrails (do not violate)

1. **No real PII in development.** Use only synthetic/mock donor data. Never hardcode or commit real Aadhaar numbers, health data, or credentials.
2. **Never store raw Aadhaar.** Identity is via ABHA; store only a reference/masked value.
3. **External integrations behind interfaces.** ABDM/ABHA, WhatsApp/SMS, and e-RaktKosh must each be an adapter with a mock implementation. Do **not** invent or assume a live e-RaktKosh API — leave it as a documented integration point until the real channel is confirmed.
4. **Audit everything sensitive.** Every blood-unit state change and every PII access must write an audit-log entry.
5. **Wallet stays off in production** behind a feature flag until sign-off.
6. **No secrets in source.** Environment/secret-manager only.

## Definition of done (per phase)

Acceptance criteria met · tests pass · migrations apply cleanly · requirement IDs mapped · audit entries present for sensitive actions · summary written · **stop and check in.**

## To start

> "Read `CLAUDE.md` and everything in `/docs`, then produce `/docs/IMPLEMENTATION_PLAN.md` per the instructions. Do not write application code yet — stop after the plan for my review."
