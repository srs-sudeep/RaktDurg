---
id: seeds
title: Demo Seeds
---

# Demo Seeds

## Overview

Three seed paths exist:

| Module | When | What |
|--------|------|------|
| `seed.demo_seed` | `make demo-seed` / deploy with empty DB or `FORCE_RESEED` | Rich ops demo: named users, inventory, camps, directory organizers |
| `seed.seed` | Local `make seed` only | Minimal `seed_*` users + flags (not used on production) |
| `seed.ensure_organizers` | Deploy when DB already has users | Upserts directory contacts + `org_*` logins without wipe |

:::tip Production login
Live app → use **demo seed** usernames (`superadmin` / `super123`, …).  
`seed_superadmin` and other `seed_*` accounts are **local-only** and will fail on production with 401.
:::

:::warning No Real PII
All donor names, phone numbers, and ABHA references in the seed are synthetic. Never use real patient data in development.
:::

## Full demo seed (`demo_seed`)

Idempotent upserts where possible. A **force reseed** on the VM wipes tables first, then runs `demo_seed` clean. This is what production and `make setup` / `make demo-seed` use.

### What gets created

| Entity | Notes |
|--------|-------|
| Facility | RKDURG — Durg District Hospital |
| Named users | `superadmin`, `district_admin`, `dr_meena`, `organizer_priya`, `citizen_ajay` |
| Organizer directory | Outreach list rows |
| Organizer logins | `org_<serial>` / `org123` for each directory contact |
| Donors + screenings + donations | Synthetic clinical chain |
| Blood units / components | Varied groups and lifecycle states (AVAILABLE PRBC mix for demos) |
| Camps + bookings | Mix of statuses for approval / booking queues |
| Requisitions | Pending / reserved / issued samples |
| Feature flags | `wallet_enabled = false` |

### Demo users (production + local)

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `super123` | superadmin |
| `district_admin` | `district123` | district_admin |
| `dr_meena` | `meena123` | doctor |
| `organizer_priya` | `priya123` | organizer |
| `citizen_ajay` | `ajay123` | citizen |
| `org_<serial>` | `org123` | organizer (directory) |

```http
POST /auth/token
Content-Type: application/json

{"username":"superadmin","password":"super123"}
```

## Minimal base seed (`seed.seed`) — local only

```bash
make seed
# python -m seed.seed
```

Creates one user per role with a `seed_` prefix. **Not deployed to production.**

| Username | Password | Role |
|----------|----------|------|
| `seed_superadmin` | `super123` | superadmin |
| `seed_district_admin` | `district123` | district_admin |
| `seed_doctor` | `doctor123` | doctor |
| `seed_organizer` | `organizer123` | organizer |
| `seed_citizen` | `citizen123` | citizen |

Prefer `make demo-seed` for day-to-day local work so credentials match production.

## Running locally

```bash
make demo-seed
# or inside the API container:
# python -m seed.demo_seed
```

## Production reseed

Deploy workflow input **Force reseed** sets `FORCE_RESEED=1` on the VM:

1. Wipes / recreates the application database
2. Runs migrations
3. Runs `python -m seed.demo_seed` (named personas above — **not** `seed_*`)

Without force reseed:

- Empty `users` table → full `demo_seed`
- Existing users → `ensure_organizers` only (directory + `org_*` accounts)

See [CI / CD](./ci-cd.md) and [Demo & Live Links](../demo.md).

## Key constraints respected

- `organizers.contact_name` used (not `contact_person_name`)
- Screenings are created before donations (`screening_id` NOT NULL)
- Uses `LedgerReasonEnum.COLLECTION` (not `DONATION_IN`)
- Uses `RequisitionStatusEnum.ISSUED` (not `FULFILLED`)
- Screening questionnaire JSON is bound as a named parameter (avoids `:false` bind errors)
