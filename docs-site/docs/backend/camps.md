---
id: camps
title: Camps
---

# Camps

## Overview

Donation camps are organised by NGOs, colleges, or corporates at an external venue. They submit a request; a medical officer reviews and approves or rejects it. On approval, coupons are generated for participants.

## Status Transitions

```
submitted
    ↓ (medical officer review)
under_review
    ↓           ↓
approved     rejected
    ↓           (terminal)
completed
    (or)
cancelled   ← (only before completion)
```

## Calendar Blocking

The partial unique index prevents double-booking:

```sql
CREATE UNIQUE INDEX uix_camp_calendar
  ON camps (host_facility_id, requested_date)
  WHERE status IN ('submitted', 'under_review', 'approved');
```

When a camp is rejected or cancelled, the slot is freed. Completed camps do not hold the date (a new camp can be scheduled on the same date next year).

```python
# services/camps.py
try:
    db.add(camp)
    await db.flush()
except IntegrityError:
    raise CampCalendarConflict(
        f"A camp is already scheduled at facility {request.host_facility_id} "
        f"on {request.requested_date}"
    )
```

## Organiser Registration

Organisers must have an `organizers` table record linked to their `users` record. The key column is `contact_name` (NOT `contact_person_name`):

```sql
-- Correct column name
SELECT contact_name FROM organizers WHERE user_id = :user_id;
```

## Coupon Generation

On approval, coupons are auto-generated for up to `expected_donors` participants:

```python
prefix = f"RD{camp.requested_date.strftime('%y%m')}"
# For expected_donors = 50:
# RD2402-0001, RD2402-0002, ..., RD2402-0050
```

Each coupon has:
- `code` — printable unique code
- `status` — `unused` / `used` / `void`
- `used_by` — donor_id when redeemed (nullable)
- `used_at` — timestamp (nullable)

## API Reference

```http
# Apply for a camp (organizer role)
POST /camps

# List camps (with optional status filter)
GET /camps?status=submitted&page=1&size=20

# Get camp details
GET /camps/{id}

# Review (approve or reject)
POST /camps/{id}/review
{"action": "approve", "review_notes": "Venue confirmed."}

# Cancel an approved camp
POST /camps/{id}/cancel

# List generated coupons
GET /camps/{id}/coupons
```
