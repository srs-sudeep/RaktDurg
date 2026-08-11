---
id: donors
title: Donors API
---

# Donors API

## POST /donors

Register a new donor.

**Roles:** `superadmin`, `doctor`, `district_admin` (clinical staff roles as configured)

```json
{
  "name": "Ramesh Kumar",
  "contact_phone": "9876543210",
  "date_of_birth": "1990-05-15",
  "sex": "male",
  "blood_group": "O+",
  "address": "Durg",
  "consent_given": true
}
```

---

## GET /donors

Paginated donor list with search, filters, and sort.

```
GET /donors?page=1&page_size=20&q=Ramesh&blood_group=O%2B&status=active&order_by=created_at&order=desc
```

| Param | Notes |
|-------|-------|
| `q` | ILIKE on name, contact_phone |
| `blood_group` | Exact match |
| `status` | Exact match |
| `order_by` | `name` \| `created_at` \| `blood_group` \| `status` |
| `order` | `asc` \| `desc` |

Response: `{ items, total, page, page_size }`.

---

## GET /donors/\{id\}

Fetch donor profile.

---

## PATCH /donors/\{id\}

Update donor profile fields.

---

## POST /donors/\{id\}/screenings

Create a pre-donation screening.

```json
{
  "donor_id": "uuid",
  "vitals": { "weight_kg": 68, "haemoglobin_gdl": 14.2 },
  "questionnaire": { "recent_illness": false },
  "sync_id": "optional-uuid"
}
```

---

## GET /donors/\{id\}/screenings

List screenings for a donor, newest first.

## Related UI

Staff donors table: `/donors` — see [Staff UI & Tables](../web/staff-ui.md).
