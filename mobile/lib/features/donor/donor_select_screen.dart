import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/remote/api_client.dart';
import '../../widgets/ui_kit.dart';

class DonorSelectScreen extends StatefulWidget {
  final String? campId;
  const DonorSelectScreen({super.key, this.campId});

  @override
  State<DonorSelectScreen> createState() => _DonorSelectScreenState();
}

class _DonorSelectScreenState extends State<DonorSelectScreen> {
  List<dynamic> _donors = [];
  bool _loading = true;
  String? _error;
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({String? q}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await ApiClient.instance.listDonors(search: q);
      setState(() => _donors = items);
    } catch (_) {
      setState(() => _error = 'Could not load donors');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final campQ = widget.campId != null ? '?camp_id=${widget.campId}' : '';
    return PageScaffold(
      title: 'Select donor',
      actions: [
        IconButton(
          tooltip: 'Register',
          icon: const Icon(Icons.person_add),
          onPressed: () => context.push('/donors/register'),
        ),
      ],
      body: Column(
        children: [
          TextField(
            controller: _search,
            decoration: const InputDecoration(
              labelText: 'Search donors',
              prefixIcon: Icon(Icons.search),
            ),
            textInputAction: TextInputAction.search,
            onSubmitted: (v) => _load(q: v.trim()),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? EmptyState(message: _error!, action: PrimaryButton(label: 'Retry', icon: Icons.refresh, onPressed: _load))
                    : _donors.isEmpty
                        ? EmptyState(
                            message: 'No donors found',
                            action: PrimaryButton(
                              label: 'Register donor',
                              icon: Icons.person_add,
                              onPressed: () => context.push('/donors/register'),
                            ),
                          )
                        : ListView(
                            children: [
                              DataTableCard(
                                columns: const ['Name', 'Group', 'Phone'],
                                rows: [
                                  for (final raw in _donors)
                                    () {
                                      final d = raw as Map<String, dynamic>;
                                      return [
                                        d['name']?.toString() ?? '—',
                                        d['blood_group']?.toString() ?? '—',
                                        d['contact_phone']?.toString() ?? '—',
                                      ];
                                    }(),
                                ],
                              ),
                              const SizedBox(height: 10),
                              ..._donors.map((raw) {
                                final d = raw as Map<String, dynamic>;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: ListRowCard(
                                    title: d['name']?.toString() ?? '',
                                    subtitle: '${d['blood_group']} · ${d['contact_phone']}',
                                    onTap: () => context.push('/screening/${d['id']}$campQ'),
                                  ),
                                );
                              }),
                            ],
                          ),
          ),
        ],
      ),
    );
  }
}
