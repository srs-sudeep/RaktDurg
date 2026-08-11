---
id: offline-sync
title: Offline Sync Design
---

# Offline Sync Design

Donation camps are often held in areas with intermittent mobile connectivity. The Flutter app supports fully offline operation with deterministic sync when connectivity returns.

## What Is Stored Offline

| Data | Storage | Notes |
|------|---------|-------|
| Screening records | sqflite | With sync_id UUID |
| Donation metadata | sqflite | With sync_id UUID |
| Pre-allocated barcode ranges | sqflite + memory | `BarcodeSequence` per facility |
| Auth token | flutter_secure_storage | For next-launch rehydration |

## Sync ID Design

Every offline record gets a **sync_id** (a UUID generated on the device):

```dart
// screening_dao.dart
final syncId = const Uuid().v4();
await screeningDao.insert(ScreeningRecord(
  syncId: syncId,
  donorId: donorId,
  vitals: vitals,
  syncedAt: null,   // null = not yet synced
));
```

The server stores sync_ids in `sync_queue` table. If the same sync_id arrives twice (network retry), the server returns the existing result — **no duplicates**.

## Conflict Detection

A conflict occurs when two offline records are created for the same donor within a 2-hour window:

```python
# routers/sync.py
existing = await db.execute(
    select(Screening)
    .where(Screening.donor_id == item.donor_id)
    .where(Screening.created_at > datetime.utcnow() - timedelta(hours=2))
)
if existing.scalar():
    result.status = "conflict"
    result.conflict_reason = "duplicate_within_2h"
```

Conflicts are **not rejected** — they are flagged and returned to the app. The phlebotomist can review and choose to submit the override.

## Batch Sync API

```http
POST /sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "sync_id": "uuid",
      "type": "screening",
      "donor_id": "uuid",
      "vitals": {...},
      "questionnaire": {...},
      "created_at_device": "2024-01-15T09:30:00Z"
    }
  ]
}
```

Response:
```json
{
  "processed": 5,
  "failed": 0,
  "conflicts": 1,
  "results": [
    {"sync_id": "uuid", "status": "ok", "server_id": "uuid"},
    {"sync_id": "uuid", "status": "conflict", "conflict_reason": "duplicate_within_2h"}
  ]
}
```

## SyncManager (Flutter)

```dart
// sync_manager.dart
Future<void> sync() async {
  final pending = await _screeningDao.getPending();
  final batches = pending.slices(20); // 20 per request

  for (final batch in batches) {
    final response = await _apiClient.syncBatch(batch);
    for (final result in response.results) {
      if (result.status == 'ok') {
        await _screeningDao.markSynced(result.syncId);
      }
    }
  }
}
```

## Barcode Pre-allocation

When connectivity is available (e.g. at camp start), the app can pre-allocate a range of barcodes:

```
Server: BarcodeSequence table, SELECT … FOR UPDATE → increment last_seq
App: stores range [from, to] in local DB
Camp staff: scan unit → app picks next from local range → no network needed
Sync: barcode assignments synced back with the unit data
```

This ensures barcodes remain unique even if two devices are offline simultaneously, because each device gets a non-overlapping range.
