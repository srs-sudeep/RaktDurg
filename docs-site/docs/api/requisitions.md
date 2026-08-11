---
id: requisitions
title: Requisitions API
---

# Requisitions API

## POST /requisitions

Create a blood component request.

**Roles:** admin, medical_officer, inventory_officer

```json
{
  "patient_name": "Sunita Devi",
  "patient_id": "WARD-2024-0042",
  "ward": "ICU-2",
  "blood_group": "B+",
  "component_type": "packed_rbc",
  "quantity": 2,
  "priority": "urgent"
}
```

---

## GET /requisitions

List requisitions with search, filters, and sort.

```
GET /requisitions?facility_id=…&status=pending&blood_group=B%2B&priority=urgent&q=Sunita&page=1&page_size=50&order_by=requested_at&order=desc
```

| Param | Notes |
|-------|-------|
| `q` | patient_name, patient_hospital_id |
| `status` / `blood_group` / `priority` | Filters |
| `order_by` | `requested_at` \| `status` \| `priority` \| `patient_name` \| `blood_group` |

---

## GET /requisitions/\{id\}

Fetch requisition details including reserved components.

---

## POST /requisitions/\{id\}/reserve

Reserve components via FEFO.

**Roles:** admin, inventory_officer

No request body needed — uses FEFO to pick earliest-expiry matching components.

**Response:** List of reserved components with expiry dates.

---

## POST /requisitions/\{id\}/issue

Issue reserved components to the ward.

**Roles:** admin, inventory_officer

Requires status = `fully_reserved`.

---

## POST /requisitions/\{id\}/cancel

Cancel a requisition (if not yet issued).

**Roles:** admin, medical_officer, inventory_officer

Cannot cancel if status is `partially_issued`, `issued`, or `cancelled`.

---

## POST /requisitions/issues/\{issue_id\}/transfusion

Record that a transfusion was completed.

**Roles:** admin, medical_officer

```json
{
  "transfused_at": "2024-01-15T14:30:00Z",
  "reaction": null,
  "notes": "Uneventful transfusion"
}
```
