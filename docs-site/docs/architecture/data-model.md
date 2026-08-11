---
id: data-model
title: Data Model
---

# Data Model

## Core Tables

### `facilities`
Central registry of blood bank locations.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| facility_code | VARCHAR(6) UNIQUE | Used in barcode prefix |
| district | TEXT | |
| state | TEXT | |
| is_active | BOOLEAN | |

### `users`
Staff accounts. Passwords bcrypt-hashed. Refresh tokens SHA-256 hashed.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | TEXT UNIQUE | |
| hashed_password | TEXT | bcrypt |
| role | UserRoleEnum | 8 roles |
| facility_id | UUID FK → facilities | nullable (admin has no facility) |
| is_active | BOOLEAN | |

### `donors`
Donor profile. DPDP fields enforced.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| full_name | TEXT | |
| phone | VARCHAR(15) | |
| date_of_birth | DATE | |
| blood_group | BloodGroupEnum | A+, A-, B+, B-, AB+, AB-, O+, O- |
| abha_reference | TEXT | masked, NOT raw ABHA ID |
| consent_given | BOOLEAN | DPDP consent |
| consent_date | DATE | |
| facility_id | UUID FK → facilities | nullable |

### `screenings`
Pre-donation health check. Created before donation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| donor_id | UUID FK → donors | |
| screened_by | UUID FK → users | |
| eligible | BOOLEAN | computed by eligibility engine |
| defer_reason | TEXT | nullable |
| sync_id | UUID UNIQUE | offline idempotency key |
| vitals | JSONB | weight, Hb, BP, pulse, temp |
| questionnaire | JSONB | pregnancy, illness, surgery flags |
| created_at | TIMESTAMPTZ | |

### `donations`
Blood collection event. Requires `screening_id` (NOT NULL).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| donor_id | UUID FK → donors | |
| facility_id | UUID FK → facilities | |
| screening_id | UUID FK → screenings | NOT NULL |
| donated_at | TIMESTAMPTZ | |
| volume_ml | INTEGER | typically 450 |
| created_at | TIMESTAMPTZ | no updated_at |

### `blood_units`
A bag collected from one donation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| barcode | VARCHAR(15) UNIQUE | `RD + facility_code(6) + seq(06d) + check(1)` |
| donation_id | UUID FK → donations | |
| lifecycle_state | UnitLifecycleState | 9 states |
| release_status | TEXT | pending / approved |
| created_at, updated_at | TIMESTAMPTZ | |

### `components`
A blood component split from a unit (e.g. Packed RBC, Plasma, Platelets).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| unit_id | UUID FK → blood_units | |
| facility_id | UUID FK → facilities | |
| blood_group | BloodGroupEnum | |
| component_type | ComponentTypeEnum | whole_blood, packed_rbc, plasma, platelets, cryo |
| volume_ml | INTEGER | |
| expiry_datetime | TIMESTAMPTZ | FEFO ordering key |
| status | TEXT | available / reserved / issued / discarded / expired |

### `stock_ledger`
Immutable ledger of inventory changes. Never deleted.

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| facility_id | UUID FK | |
| blood_group | BloodGroupEnum | |
| component_type | ComponentTypeEnum | |
| change_qty | INTEGER | positive = in, negative = out |
| balance_after | INTEGER | computed running total |
| reason | LedgerReasonEnum | `collection`, `reserve`, `unreserve`, `issue`, `transfused`, `discard`, `expiry`, `transfer_in`, `transfer_out`, `adjustment` |
| reference_id | UUID | nullable FK to the triggering entity |
| reference_type | TEXT | `component`, `requisition`, etc. |
| recorded_by | UUID FK → users | |
| recorded_at | TIMESTAMPTZ | |

### `audit_logs`
Append-only. PostgreSQL RULE prevents UPDATE or DELETE.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| actor_id | UUID FK → users | |
| action | TEXT | verb string |
| resource_type | TEXT | |
| resource_id | UUID | |
| old_data | JSONB | nullable |
| new_data | JSONB | nullable |
| created_at | TIMESTAMPTZ | |

## Lifecycle States

### Blood Unit (`UnitLifecycleState`)

```
collected ──→ tested ──→ separated ──→ stored ──→ reserved ──→ issued ──→ transfused
     │            │           │            │            │           │
     └─────────────────────────────────────────────────────→ discarded
                                            │
                                            └──────────────────────→ expired
```

Terminal states: `transfused`, `discarded`, `expired`

### Requisition (`RequisitionStatusEnum`)

```
pending → partially_reserved → fully_reserved → partially_issued → issued
        └──────────────────────────────────────────────────────→ cancelled
```

## Key Constraints

```sql
-- Barcode format enforced at application layer (Luhn mod-36)
-- Partial unique index for camp calendar blocking:
CREATE UNIQUE INDEX uix_camp_calendar
  ON camps (host_facility_id, requested_date)
  WHERE status IN ('submitted', 'under_review', 'approved');

-- Wallet balance never goes negative:
ALTER TABLE wallets ADD CONSTRAINT ck_balance_non_negative CHECK (balance >= 0);

-- Audit log protection:
CREATE RULE no_update_audit_logs AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_logs AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
```
