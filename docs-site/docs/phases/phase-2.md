---
id: phase-2
title: "Phase 2: Donors & Offline Screening"
---

# Phase 2: Donors & Offline Screening

## Goal

Implement donor registration, pre-donation eligibility screening, and offline-capable mobile data capture with sync.

## Eligibility Engine

`backend/app/core/eligibility.py` implements 10 screening rules:

| Rule | Criteria | Outcome |
|------|----------|---------|
| Age | 18 – 65 years | Defer if outside range |
| Weight | ≥ 45 kg | Defer if below |
| Haemoglobin | ≥ 12.5 g/dL | Defer if below |
| Blood pressure | Systolic 90–160, Diastolic 50–100 mmHg | Defer if outside |
| Pulse | 50–100 bpm | Defer if outside |
| Temperature | ≤ 37.5 °C | Defer if above |
| Pregnancy | Not pregnant | Defer if pregnant |
| Recent illness | No illness in last 7 days | Defer |
| Recent surgery | No surgery in last 6 months | Defer |
| Tattoo | No tattoo in last 12 months | Temporary defer |
| STI history | — | **Permanent defer** |
| Donation interval | ≥ 90 days since last donation | Defer if too soon |

Rules run in order. First failing rule sets the defer reason.

```python
@dataclass
class EligibilityDecision:
    eligible: bool
    defer_reason: str | None
    defer_type: Literal["none", "temporary", "permanent"]
    evaluated_at: datetime
```

## Donor Registration

```http
POST /donors
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

- `abha_reference` is masked — raw ABHA number never stored
- `consent_given` + `consent_date` required for DPDP compliance
- ABHA verification called via `adapters/abha.py` (mocked in dev)

## Screening Workflow

```
1. Phlebotomist opens Flutter app (online or offline)
2. Selects donor (by phone or QR scan)
3. Enters vitals + questionnaire
4. Eligibility engine runs locally (same rules, pure Dart impl)
5. Record stored in sqflite with sync_id
6. If eligible: donation can proceed immediately (offline)
7. When connectivity returns: SyncManager.sync() bulk-uploads
```

The screening record is **always created before the donation**. `donations.screening_id` is NOT NULL — this is enforced at the database level.

## Sync API

```http
POST /sync
Authorization: Bearer <token>

{
  "items": [
    {
      "type": "screening",
      "sync_id": "550e8400-e29b-41d4-a716-446655440000",
      "donor_id": "uuid",
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
      "created_at_device": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Mobile Implementation

### sqflite Schema

```sql
CREATE TABLE screenings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_id TEXT UNIQUE NOT NULL,
  donor_id TEXT NOT NULL,
  vitals TEXT NOT NULL,          -- JSON blob
  questionnaire TEXT NOT NULL,   -- JSON blob
  eligible INTEGER NOT NULL,     -- 0/1
  defer_reason TEXT,
  synced_at TEXT,                -- NULL = pending
  created_at TEXT NOT NULL
);
CREATE INDEX idx_screenings_sync_id ON screenings(sync_id);
CREATE INDEX idx_screenings_synced_at ON screenings(synced_at);
```

### SyncManager

```dart
// Runs automatically when app comes online
// Also triggered manually from Sync screen
Future<void> sync() async {
  state = SyncState.syncing;
  final pending = await _dao.getPending();  // WHERE synced_at IS NULL
  final batches = pending.slices(20);
  for (final batch in batches) {
    final resp = await _api.syncBatch(batch);
    for (final r in resp.results) {
      if (r.status == 'ok') await _dao.markSynced(r.syncId);
    }
  }
  state = SyncState.idle;
}
```

## API Endpoints Added

| Method | Path | Roles |
|--------|------|-------|
| POST | `/donors` | admin, medical_officer, lab_tech, phlebotomist |
| GET | `/donors` | admin, medical_officer, lab_tech, phlebotomist |
| GET | `/donors/{id}` | admin, medical_officer, lab_tech, phlebotomist |
| PATCH | `/donors/{id}` | admin, medical_officer, phlebotomist |
| POST | `/donors/{id}/screenings` | admin, medical_officer, lab_tech, phlebotomist |
| GET | `/donors/{id}/screenings` | admin, medical_officer, lab_tech |
| POST | `/sync` | phlebotomist, lab_tech |
