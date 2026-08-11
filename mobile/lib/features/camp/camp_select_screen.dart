import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/remote/api_client.dart';

class CampSelectScreen extends StatefulWidget {
  const CampSelectScreen({super.key});

  @override
  State<CampSelectScreen> createState() => _CampSelectScreenState();
}

class _CampSelectScreenState extends State<CampSelectScreen> {
  List<dynamic> _camps = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await ApiClient.instance.listCamps();
      setState(() {
        _camps = items.where((c) => (c as Map)['status'] == 'approved' || c['status'] == 'completed').toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select camp'),
        backgroundColor: const Color(0xFFDC2626),
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                ListTile(
                  title: const Text('No camp (facility only)'),
                  onTap: () => context.push('/donors/select'),
                ),
                ..._camps.map((raw) {
                  final c = raw as Map<String, dynamic>;
                  return ListTile(
                    title: Text(c['camp_name']?.toString() ?? ''),
                    subtitle: Text('${c['requested_date']} · ${c['location']}'),
                    trailing: Text(c['status']?.toString() ?? ''),
                    onTap: () => context.push('/donors/select?camp_id=${c['id']}'),
                  );
                }),
              ],
            ),
    );
  }
}
