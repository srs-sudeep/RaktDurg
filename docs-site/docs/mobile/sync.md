---
id: sync
title: Sync Manager
---

# Sync Manager

## SyncManager (StateNotifier)

```dart
// mobile/lib/features/sync/sync_manager.dart
enum SyncState { idle, syncing, error }

class SyncManager extends StateNotifier<SyncState> {
  SyncManager(this._dao, this._api) : super(SyncState.idle);

  Future<void> sync() async {
    state = SyncState.syncing;
    try {
      final pending = await _dao.getPending();
      final batches = _slice(pending, 20);

      for (final batch in batches) {
        final response = await _api.syncBatch(batch);
        for (final result in response.results) {
          if (result.status == 'ok' || result.status == 'duplicate') {
            await _dao.markSynced(result.syncId);
          }
          // 'conflict' and 'error' stay pending for manual review
        }
      }
      state = SyncState.idle;
    } catch (e) {
      state = SyncState.error;
    }
  }
}
```

## Sync Screen

```dart
// mobile/lib/features/sync/sync_screen.dart
Consumer(builder: (context, ref, _) {
  final syncState = ref.watch(syncManagerProvider);
  final pendingCount = ref.watch(pendingCountProvider);

  return Column(
    children: [
      Text('Pending: $pendingCount records'),
      ElevatedButton(
        onPressed: syncState == SyncState.syncing
            ? null
            : () => ref.read(syncManagerProvider.notifier).sync(),
        child: syncState == SyncState.syncing
            ? CircularProgressIndicator()
            : Text('Sync Now'),
      ),
    ],
  );
})
```

## Batch Size

The default batch size is **20 records per request**. This balances:
- Keeping individual requests small (faster retries)
- Avoiding too many round trips on a slow connection

## Error Handling

| Result Status | Action |
|---------------|--------|
| `ok` | Mark synced in local DB |
| `duplicate` | Mark synced (server already has it) |
| `conflict` | Keep pending — flag for user review |
| `error` | Keep pending — will retry on next sync |

## Conflict Review

If a conflict is returned, the sync screen shows a "Review Conflicts" button. The phlebotomist can see the conflicting records and choose to force-submit or discard the local copy.
