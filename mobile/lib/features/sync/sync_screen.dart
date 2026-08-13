import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../widgets/ui_kit.dart';
import 'sync_manager.dart';

class SyncScreen extends ConsumerWidget {
  const SyncScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(syncManagerProvider);

    return PageScaffold(
      title: 'Sync',
      showLogo: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionCard(
            title: 'Offline queue',
            subtitle: state.pendingCount == 0 ? 'All clear' : 'Awaiting upload',
            child: InfoTable(
              rows: [
                ('Pending', '${state.pendingCount}'),
                (
                  'Last sync',
                  state.lastSyncedAt == null ? 'Never' : _formatTime(state.lastSyncedAt!),
                ),
                ('Status', state.isSyncing ? 'Syncing…' : (state.pendingCount == 0 ? 'Idle' : 'Ready')),
              ],
            ),
          ),
          if (state.lastError != null) ...[
            const SizedBox(height: 12),
            ErrorBanner(state.lastError!),
          ],
          const SizedBox(height: 16),
          PrimaryButton(
            label: state.isSyncing ? 'Syncing…' : 'Sync now',
            icon: Icons.sync,
            loading: state.isSyncing,
            onPressed: () => ref.read(syncManagerProvider.notifier).sync(),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final local = dt.toLocal();
    return '${local.day}/${local.month}/${local.year} ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }
}
