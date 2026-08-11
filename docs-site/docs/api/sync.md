---
id: sync
title: Sync API
---

# Sync API

## POST /sync

Bulk sync offline-captured records from the mobile app.

**Roles:** phlebotomist, lab_tech

**Request:**
```json
{
  "items": [
    {
      "type": "screening",
      "sync_id": "550e8400-e29b-41d4-a716-446655440000",
      "donor_id": "uuid",
      "vitals": {
        "weight_kg": 65,
        "haemoglobin_gdl": 13.5,
        "systolic_bp": 118,
        "diastolic_bp": 78,
        "pulse_bpm": 70,
        "temperature_c": 36.6
      },
      "questionnaire": {
        "is_pregnant": false,
        "recent_illness": false,
        "recent_surgery": false,
        "tattoo_last_12m": false,
        "sti_history": false
      },
      "created_at_device": "2024-01-15T09:30:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "processed": 1,
  "failed": 0,
  "conflicts": 0,
  "results": [
    {
      "sync_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "ok",
      "server_id": "uuid"
    }
  ]
}
```

### Result Statuses

| Status | Meaning |
|--------|---------|
| `ok` | Successfully processed |
| `duplicate` | sync_id already in server — returns existing server_id |
| `conflict` | Same donor screened within ±2 hours by another device |
| `error` | Processing failed — see `error_message` field |

### Idempotency

If the same `sync_id` is submitted again (network retry), the server returns `status: "duplicate"` with the original `server_id` — no duplicate records are created.
