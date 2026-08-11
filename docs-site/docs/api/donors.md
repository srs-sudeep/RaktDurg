---
id: donors
title: Donors API
---

# Donors API

## POST /donors

Register a new donor.

**Roles:** admin, medical_officer, lab_tech, phlebotomist

```json
{
  "full_name": "Ramesh Kumar",
  "phone": "9876543210",
  "date_of_birth": "1990-05-15",
  "blood_group": "O+",
  "abha_reference": "ABHA-XXXX-XXXX-5678",
  "consent_given": true,
  "consent_date": "2024-01-15"
}
```

---

## GET /donors

Paginated donor list with optional search.

```
GET /donors?page=1&size=20&search=Ramesh&blood_group=O%2B
```

---

## GET /donors/{id}

Fetch donor profile.

---

## PATCH /donors/{id}

Update donor profile fields.

---

## POST /donors/{id}/screenings

Create a pre-donation screening.

**Roles:** admin, medical_officer, lab_tech, phlebotomist

```json
{
  "vitals": {
    "weight_kg": 68,
    "haemoglobin_gdl": 14.2,
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "pulse_bpm": 72,
    "temperature_c": 36.8
  },
  "questionnaire": {
    "is_pregnant": false,
    "recent_illness": false,
    "recent_surgery": false,
    "tattoo_last_12m": false,
    "sti_history": false
  },
  "sync_id": "optional-uuid"
}
```

**Response** includes `eligible: bool` and `defer_reason`.

---

## GET /donors/{id}/screenings

List all screenings for a donor, newest first.
