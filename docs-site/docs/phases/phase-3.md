---
id: phase-3
title: "Phase 3: Camp Management"
---

# Phase 3: Camp Management

## Goal

Allow organisations (NGOs, colleges, corporates) to apply for blood donation camps, have medical officers review and approve them, and generate redeemable coupons for participants.

## Camp Lifecycle

```
submitted → under_review → approved → completed
                        └→ rejected
approved → cancelled  (before completion)
```

## Calendar Blocking

Two camps cannot be scheduled at the same facility on the same date. This is enforced at the **database level** via a partial unique index:

```sql
CREATE UNIQUE INDEX uix_camp_calendar
  ON camps (host_facility_id, requested_date)
  WHERE status IN ('submitted', 'under_review', 'approved');
```

The service layer catches `IntegrityError` and raises `CampCalendarConflict` (HTTP 409).

This means:
- A rejected or cancelled camp frees the date slot
- A completed camp does not block future re-use of that date

## Camp Application

```http
POST /camps
Authorization: Bearer <token>  (role: organizer)

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

Note: The column is `contact_name` (not `contact_person_name`).

## Camp Review

```http
POST /camps/{id}/review
Authorization: Bearer <token>  (role: medical_officer or admin)

{
  "action": "approve",   // or "reject"
  "review_notes": "Venue confirmed, MO assigned.",
  "rejection_reason": null
}
```

On approval, the service automatically generates coupons:

```python
async def _generate_coupons(camp: Camp, db: AsyncSession):
    prefix = f"RD{camp.requested_date.strftime('%y%m')}"
    for i in range(1, camp.expected_donors + 1):
        code = f"{prefix}-{i:04d}"
        db.add(Coupon(camp_id=camp.id, code=code, status="unused"))
```

Example coupon codes: `RD2402-0001`, `RD2402-0002`, ...

## Coupon Distribution

```http
GET /camps/{id}/coupons
Authorization: Bearer <token>  (role: admin, medical_officer, organizer)
```

Returns the full list. Organizers distribute physical coupons to participants. At donation time, the phlebotomist scans or enters the coupon code to link the donation.

## API Endpoints Added

| Method | Path | Roles |
|--------|------|-------|
| POST | `/camps` | admin, organizer |
| GET | `/camps` | admin, medical_officer, organizer |
| GET | `/camps/\{id\}` | admin, medical_officer, organizer |
| POST | `/camps/\{id\}/review` | admin, medical_officer |
| POST | `/camps/\{id\}/cancel` | admin, medical_officer |
| GET | `/camps/\{id\}/coupons` | admin, medical_officer, organizer |
