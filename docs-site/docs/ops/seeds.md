---
id: seeds
title: Demo Seeds
---

# Demo Seeds

## Overview

`backend/seed/demo_seed.py` creates synthetic data for development and testing. It is **idempotent** — running it twice does not create duplicates.

:::warning No Real PII
All donor names, phone numbers, and ABHA references in the seed are synthetic. Never use real patient data in development.
:::

## What Gets Created

| Entity | Count | Notes |
|--------|-------|-------|
| Facility | 1 | RKDURG — Durg District Hospital |
| Users | 5 | One per role with dev-only passwords |
| Donors | 15 | Synthetic names, fake phone numbers |
| Camps | 2 | One approved, one completed |
| Screenings | 12 | Linked to donors |
| Donations | 12 | Each linked to a screening (screening_id NOT NULL) |
| Blood Units | 12 | Varied lifecycle states |
| Components | ~36 | 3 per unit (packed_rbc, plasma, platelets) |
| Requisitions | 5 | Various statuses |
| Feature Flags | 1 | `wallet_enabled = false` |

## Idempotency

Every insert uses `ON CONFLICT DO NOTHING`:

```python
await db.execute(
    insert(Facility)
    .values(id=FACILITY_ID, name="Durg District Hospital", ...)
    .on_conflict_do_nothing()
)
```

This means `make demo-seed` is safe to run multiple times.

## Demo Users

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `super123` | superadmin |
| `district_admin` | `district123` | district_admin |
| `dr_meena` | `meena123` | doctor |
| `organizer_priya` | `priya123` | organizer |
| `citizen_ajay` | `ajay123` | citizen |

Passwords are bcrypt-hashed. These credentials only work when `ENVIRONMENT=development`.

## Running

```bash
make demo-seed
# or
docker compose --profile demo up
```

## Key Constraints Respected

- `organizers.contact_name` used (not `contact_person_name`)
- Screenings are created before donations (screening_id NOT NULL)
- Uses `LedgerReasonEnum.COLLECTION` (not `DONATION_IN`)
- Uses `RequisitionStatusEnum.ISSUED` (not `FULFILLED`)
