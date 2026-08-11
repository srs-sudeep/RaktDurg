---
id: camps
title: Camps API
---

# Camps API

## POST /camps

Apply for a donation camp.

**Roles:** admin, organizer

```json
{
  "organizer_name": "Rotary Club Durg",
  "contact_name": "Priya Sharma",
  "contact_phone": "9876543210",
  "requested_date": "2024-02-20",
  "expected_donors": 50,
  "venue_address": "Rotary Bhawan, Nehru Nagar, Durg",
  "host_facility_id": "uuid"
}
```

**Errors:**
- `409 Conflict` — another camp already scheduled at this facility on this date

---

## GET /camps

Paginated camp list with search and sort.

```
GET /camps?camp_status=submitted&page=1&page_size=50&q=rotary&order_by=requested_date&order=desc
```

| Param | Notes |
|-------|-------|
| `camp_status` | Filter by status |
| `q` | ILIKE on camp_name, location |
| `order_by` | `requested_date` \| `camp_name` \| `status` \| `created_at` |
| `order` | `asc` \| `desc` |

---

## GET /camps/bookings/list

Staff booking queue (array, not paginated).

```
GET /camps/bookings/list?status=requested&q=ajay&order_by=created_at&order=desc
```

| Param | Notes |
|-------|-------|
| `status` | Booking status |
| `q` | Camp name, donor name, phone |
| `order_by` | `created_at` \| `status` \| `camp_name` \| `donor_name` |
---

## GET /camps/\{id\}

Fetch camp details.

---

## POST /camps/\{id\}/review

Approve or reject a camp.

**Roles:** admin, medical_officer

```json
{
  "action": "approve",
  "review_notes": "Venue confirmed, MO assigned: Dr. Sharma",
  "rejection_reason": null
}
```

On approval: coupons auto-generated (`RD\{YYMM\}-\{seq:04d\}`).

---

## POST /camps/\{id\}/cancel

Cancel an approved camp.

**Roles:** admin, medical_officer

Frees the date slot (removes from the partial unique index).

---

## GET /camps/\{id\}/coupons

List all coupons for a camp.

**Roles:** admin, medical_officer, organizer

```json
[
  {"code": "RD2402-0001", "status": "unused", "used_by": null},
  {"code": "RD2402-0002", "status": "used", "used_by": "donor-uuid"}
]
```
