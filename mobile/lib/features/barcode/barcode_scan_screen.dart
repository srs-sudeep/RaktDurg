import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/eligibility.dart';
import '../../data/remote/api_client.dart';
import '../../features/auth/auth_notifier.dart';

class BarcodeScanScreen extends ConsumerStatefulWidget {
  const BarcodeScanScreen({super.key});

  @override
  ConsumerState<BarcodeScanScreen> createState() => _BarcodeScanScreenState();
}

class _BarcodeScanScreenState extends ConsumerState<BarcodeScanScreen> {
  final _ctrl = TextEditingController();
  String? _result;
  String? _error;
  List<String> _allocated = [];
  bool _busy = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _lookup() async {
    final raw = _ctrl.text.trim().toUpperCase();
    if (raw.isEmpty) return;
    if (!validateBarcode(raw)) {
      setState(() {
        _error = 'Invalid barcode check digit';
        _result = null;
      });
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.scanBarcode(raw);
      final unit = data['unit'] as Map<String, dynamic>?;
      setState(() {
        _result =
            '${unit?['barcode']} · ${unit?['blood_group']} · ${unit?['lifecycle_state']}';
      });
    } catch (_) {
      setState(() {
        _error = 'Unit not found for $raw';
        _result = null;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _preAllocate() async {
    final facilityId = ref.read(authProvider).facilityId;
    if (facilityId == null || facilityId.isEmpty) {
      setState(() => _error = 'No facility on account');
      return;
    }
    setState(() => _busy = true);
    try {
      final data = await ApiClient.instance.preAllocateBarcodes(
        facilityId: facilityId,
        count: 10,
      );
      final codes = (data['barcodes'] as List<dynamic>).cast<String>();
      setState(() {
        _allocated = codes;
        _error = null;
      });
    } catch (_) {
      setState(() => _error = 'Pre-allocate failed');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Barcode'),
        backgroundColor: const Color(0xFFDC2626),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            tooltip: 'Pre-allocate 10',
            onPressed: _busy ? null : _preAllocate,
            icon: const Icon(Icons.download),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Enter or paste a unit barcode (camera scan requires a physical device).',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _ctrl,
            decoration: const InputDecoration(
              labelText: 'Barcode',
              hintText: 'RDRKDURG000001X',
            ),
            textCapitalization: TextCapitalization.characters,
            onSubmitted: (_) => _lookup(),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _busy ? null : _lookup,
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: _busy
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Lookup unit'),
          ),
          if (_result != null) ...[
            const SizedBox(height: 16),
            Text(_result!, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          if (_allocated.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('Offline range', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Center(child: QrImageView(data: _allocated.first, size: 140)),
            ..._allocated.map(
              (c) => Text(c, style: const TextStyle(fontFamily: 'monospace')),
            ),
          ],
        ],
      ),
    );
  }
}
