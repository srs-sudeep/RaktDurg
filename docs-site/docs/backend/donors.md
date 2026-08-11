---
id: donors
title: Donors
---

# Donors

## Registration

```http
POST /donors
Authorization: Bearer <token>
Content-Type: application/json

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

### ABHA Verification

The `abha_reference` is verified via `adapters/abha.py`:

```python
# In development: always returns verified=True
# In production: calls ABHA API with the reference
async def verify_abha_reference(reference: str) -> ABHAVerifyResult:
    if settings.ENVIRONMENT in ("development", "test"):
        return ABHAVerifyResult(verified=True, masked_id=reference)
    raise NotImplementedError("Configure real ABHA integration")
```

The raw 14-digit ABHA number is never sent to or stored in RAKT Durg.

## Screening

A screening must be created before a donation can be recorded:

```http
POST /donors/{id}/screenings
Authorization: Bearer <token>

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
  "sync_id": "optional-uuid-for-offline-idempotency"
}
```

The eligibility engine runs all 10 rules and returns `eligible: true/false` with `defer_reason`.

## Pagination

```http
GET /donors?page=1&size=20&search=Ramesh&blood_group=O%2B
```

Response:
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

## DPDP Compliance

| Requirement | Implementation |
|-------------|----------------|
| Consent | `consent_given` (bool) + `consent_date` required |
| No raw Aadhaar | `abha_reference` is masked string only |
| Data minimisation | Phone not used for marketing; only operational contact |
| Retention | `created_at` tracked; retention policy applied via periodic cleanup task |

## Donor History

```http
GET /donors/{id}/screenings
```

Returns all screening records for a donor, ordered by `created_at DESC`.
