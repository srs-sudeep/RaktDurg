---
id: units
title: Units API
---

# Units API

## POST /units

Create a new blood unit (assigns barcode).

**Roles:** admin, medical_officer, lab_tech, phlebotomist

**Request:**
```json
{
  "donation_id": "uuid",
  "volume_ml": 450
}
```

**Response:** `UnitOut` with generated barcode.

---

## GET /units

Paginated inventory list.

```
GET /units?facility_id=…&page=1&page_size=50&q=RD&blood_group=O%2B&lifecycle_state=stored&order_by=created_at&order=desc
```

| Param | Notes |
|-------|-------|
| `facility_id` | Scope to facility |
| `q` | ILIKE on barcode |
| `blood_group` / `lifecycle_state` | Filters |
| `order_by` | `barcode` \| `created_at` \| `expiry_datetime` \| `blood_group` \| `lifecycle_state` |

---

## GET /units/scan/\{barcode\}

Look up a unit by its 15-character barcode.

**Roles:** admin, medical_officer, lab_tech, phlebotomist, inventory_officer

**Response:** `BarcodeLookupResponse` — unit details + latest state.

---

## GET /units/\{unit_id\}

Fetch unit by UUID.

---

## POST /units/\{unit_id\}/tests

Record test panel results.

**Roles:** admin, medical_officer, lab_tech

**Request:**
```json
{
  "panels": [
    {"panel_name": "HIV", "result": "negative"},
    {"panel_name": "HBsAg", "result": "negative"},
    {"panel_name": "HCV", "result": "negative"},
    {"panel_name": "Malaria", "result": "negative"},
    {"panel_name": "VDRL", "result": "negative"}
  ]
}
```

When all 5 panels are recorded → `release_status = "approved"`, `lifecycle_state = "tested"`.

---

## POST /units/\{unit_id\}/components

Separate a unit into blood components (FEFO inventory).

**Request:**
```json
{
  "components": [
    {
      "component_type": "packed_rbc",
      "volume_ml": 280,
      "expiry_datetime": "2024-02-25T00:00:00Z"
    }
  ]
}
```

**Effect:** Unit state → `separated`. Each component gets a `collection` ledger entry.

---

## PATCH /units/\{unit_id\}/state

Transition unit to a new lifecycle state.

**Request:**
```json
{
  "target_state": "stored",
  "reason": "Transferred to cold storage"
}
```

Invalid transitions return HTTP 400.
