import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/local/dao/screening_dao.dart';
import '../../data/remote/api_client.dart';

class SyncState {
  final bool isSyncing;
  final int pendingCount;
  final String? lastError;
  final DateTime? lastSyncedAt;

  const SyncState({
    this.isSyncing = false,
    this.pendingCount = 0,
    this.lastError,
    this.lastSyncedAt,
  });

  SyncState copyWith({
    bool? isSyncing,
    int? pendingCount,
    String? lastError,
    DateTime? lastSyncedAt,
  }) =>
      SyncState(
        isSyncing: isSyncing ?? this.isSyncing,
        pendingCount: pendingCount ?? this.pendingCount,
        lastError: lastError,
        lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      );
}

class SyncManager extends StateNotifier<SyncState> {
  final ScreeningDao _screeningDao = ScreeningDao();

  SyncManager() : super(const SyncState()) {
    _refreshPendingCount();
  }

  Future<void> _refreshPendingCount() async {
    final count = await _screeningDao.pendingCount();
    state = state.copyWith(pendingCount: count);
  }

  Future<void> sync() async {
    if (state.isSyncing) return;
    state = state.copyWith(isSyncing: true, lastError: null);

    try {
      final pending = await _screeningDao.getPending();
      if (pending.isEmpty) {
        state = state.copyWith(isSyncing: false, pendingCount: 0, lastSyncedAt: DateTime.now());
        return;
      }

      // Batch into groups of 20 (API limit)
      final batches = <List<ScreeningRecord>>[];
      for (var i = 0; i < pending.length; i += 20) {
        batches.add(pending.sublist(i, i + 20 > pending.length ? pending.length : i + 20));
      }

      for (final batch in batches) {
        final items = batch.map((s) => _buildPayload(s)).toList();
        final response = await ApiClient.instance.syncBatch(items);
        final results = response['results'] as List<dynamic>? ?? [];

        for (final result in results) {
          final syncId = result['sync_id'] as String?;
          final status = result['status'] as String?;
          if (syncId != null && (status == 'ok' || status == 'duplicate' || status != 'conflict')) {
            if (status != 'conflict') {
              await _screeningDao.markSynced(syncId);
            }
          }
        }
      }

      await _refreshPendingCount();
      state = state.copyWith(isSyncing: false, lastSyncedAt: DateTime.now());
    } catch (e) {
      await _refreshPendingCount();
      state = state.copyWith(isSyncing: false, lastError: e.toString());
    }
  }

  Map<String, dynamic> _buildPayload(ScreeningRecord s) => {
        'entity_type': 'screening',
        'sync_id': s.syncId,
        'device_id': s.deviceId,
        'captured_at': s.screeningDatetime,
        'payload': {
          'donor_id': s.donorId,
          'camp_id': s.campId,
          'sync_id': s.syncId,
          'screening_datetime': s.screeningDatetime,
          'captured_offline': s.capturedOffline,
          'device_id': s.deviceId,
          'vitals': {
            'weight_kg': s.weightKg,
            'bp_systolic': s.bpSystolic,
            'bp_diastolic': s.bpDiastolic,
            'pulse_bpm': s.pulseBpm,
            'temperature_celsius': s.temperatureCelsius,
            'hemoglobin_g_dl': s.hemoglobinGDl,
          },
          'questionnaire': s.questionnaire,
        },
      };
}

final syncManagerProvider = StateNotifierProvider<SyncManager, SyncState>(
  (_) => SyncManager(),
);
