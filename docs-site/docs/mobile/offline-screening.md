---
id: offline-screening
title: Offline Screening
---

# Offline Screening

## How It Works

The Flutter app can capture donor screenings with no network connection. Data is stored in a local SQLite database (sqflite) and synced when connectivity returns.

## sqflite Schema

```dart
// mobile/lib/data/local/database.dart
await db.execute('''
  CREATE TABLE screenings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE NOT NULL,
    donor_id TEXT NOT NULL,
    vitals TEXT NOT NULL,
    questionnaire TEXT NOT NULL,
    eligible INTEGER NOT NULL,
    defer_reason TEXT,
    synced_at TEXT,
    created_at TEXT NOT NULL
  )
''');
CREATE INDEX idx_screenings_sync_id ON screenings(sync_id);
CREATE INDEX idx_screenings_synced_at ON screenings(synced_at);
```

`synced_at = NULL` means the record is pending sync.

## Capturing a Screening

```dart
// screening_form_screen.dart
final syncId = const Uuid().v4();

// Run eligibility check locally (same rules as server)
final decision = EligibilityEngine.assess(vitals, questionnaire);

await screeningDao.insert(ScreeningRecord(
  syncId: syncId,
  donorId: widget.donorId,
  vitals: jsonEncode(vitals.toJson()),
  questionnaire: jsonEncode(questionnaire.toJson()),
  eligible: decision.eligible ? 1 : 0,
  deferReason: decision.deferReason,
  createdAt: DateTime.now().toIso8601String(),
));
```

## ScreeningDao

```dart
// mobile/lib/data/local/dao/screening_dao.dart
class ScreeningDao {
  Future<void> insert(ScreeningRecord record) async { ... }

  Future<List<ScreeningRecord>> getPending() async {
    return db.query('screenings', where: 'synced_at IS NULL');
  }

  Future<void> markSynced(String syncId) async {
    await db.update(
      'screenings',
      {'synced_at': DateTime.now().toIso8601String()},
      where: 'sync_id = ?',
      whereArgs: [syncId],
    );
  }

  Future<int> pendingCount() async {
    final result = await db.rawQuery(
      'SELECT COUNT(*) as cnt FROM screenings WHERE synced_at IS NULL'
    );
    return result.first['cnt'] as int;
  }
}
```

## Eligibility Engine (Dart)

The same 10 eligibility rules are implemented in Dart so the app can show the eligibility decision immediately without a server round-trip:

```dart
class EligibilityDecision {
  final bool eligible;
  final String? deferReason;
  final String deferType; // 'none' | 'temporary' | 'permanent'
}

class EligibilityEngine {
  static EligibilityDecision assess(Vitals vitals, Questionnaire q) {
    if (vitals.weightKg < 45) return EligibilityDecision(eligible: false, deferReason: 'Weight below 45 kg', deferType: 'temporary');
    if (vitals.haemoglobinGdl < 12.5) return EligibilityDecision(eligible: false, deferReason: 'Haemoglobin below 12.5 g/dL', deferType: 'temporary');
    // ... 8 more rules
    return EligibilityDecision(eligible: true, deferReason: null, deferType: 'none');
  }
}
```

## Offline → Online Transition

The sync is triggered either:
1. Automatically when the app detects network connectivity (Connectivity Plus package)
2. Manually from the Sync screen

Both paths call `SyncManager.sync()`.
