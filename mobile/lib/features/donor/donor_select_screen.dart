import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/remote/api_client.dart';

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
      final items = await ApiClient.instance.listDonors();
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select donor'),
        backgroundColor: const Color(0xFFDC2626),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add),
            onPressed: () => context.push('/donors/register'),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : ListView.separated(
                  itemCount: _donors.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final d = _donors[i] as Map<String, dynamic>;
                    return ListTile(
                      title: Text(d['name']?.toString() ?? ''),
                      subtitle: Text('${d['blood_group']} · ${d['contact_phone']}'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/screening/${d['id']}$campQ'),
                    );
                  },
                ),
    );
  }
}
