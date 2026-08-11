import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/remote/api_client.dart';
import '../../widgets/ui_kit.dart';

class CampSelectScreen extends StatefulWidget {
  const CampSelectScreen({super.key});

  @override
  State<CampSelectScreen> createState() => _CampSelectScreenState();
}

class _CampSelectScreenState extends State<CampSelectScreen> {
  List<dynamic> _camps = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await ApiClient.instance.listCamps();
      setState(() {
        _camps = items
            .where((c) => (c as Map)['status'] == 'approved' || c['status'] == 'completed')
            .toList();
      });
    } catch (_) {
      setState(() => _error = 'Could not load camps');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Capture · Camp',
      showLogo: true,
      actions: [
        IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh)),
      ],
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? EmptyState(message: _error!, action: PrimaryButton(label: 'Retry', icon: Icons.refresh, onPressed: _load))
              : ListView(
                  children: [
                    const Text(
                      'Choose a camp for screening, or continue without one.',
                      style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    ListRowCard(
                      leading: const Icon(Icons.apartment, color: Color(0xFFDC2626)),
                      title: 'No camp (facility only)',
                      subtitle: 'Screen at the blood bank',
                      onTap: () => context.push('/donors/select'),
                    ),
                    const SizedBox(height: 10),
                    if (_camps.isEmpty)
                      const EmptyState(message: 'No approved camps available', icon: Icons.event_busy)
                    else
                      DataTableCard(
                        columns: const ['Camp', 'Date', 'Status'],
                        rows: [
                          for (final raw in _camps)
                            () {
                              final c = raw as Map<String, dynamic>;
                              return [
                                c['camp_name']?.toString() ?? '—',
                                c['requested_date']?.toString() ?? '—',
                                c['status']?.toString() ?? '—',
                              ];
                            }(),
                        ],
                      ),
                    const SizedBox(height: 10),
                    ..._camps.map((raw) {
                      final c = raw as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: ListRowCard(
                          title: c['camp_name']?.toString() ?? '',
                          subtitle: '${c['requested_date']} · ${c['location']}',
                          trailing: StatusChip(c['status']?.toString() ?? '', tone: StatusTone.success),
                          onTap: () => context.push('/donors/select?camp_id=${c['id']}'),
                        ),
                      );
                    }),
                  ],
                ),
    );
  }
}
