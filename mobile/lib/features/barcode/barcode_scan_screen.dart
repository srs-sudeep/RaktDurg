import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../theme/app_theme.dart';

import '../../core/eligibility.dart';
import '../../data/remote/api_client.dart';
import '../../features/auth/auth_notifier.dart';
import '../../widgets/ui_kit.dart';

class BarcodeScanScreen extends ConsumerStatefulWidget {
  const BarcodeScanScreen({super.key});

  @override
  ConsumerState<BarcodeScanScreen> createState() => _BarcodeScanScreenState();
}

class _BarcodeScanScreenState extends ConsumerState<BarcodeScanScreen> {
  final _ctrl = TextEditingController();
  final _scanner = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    formats: const [BarcodeFormat.code128, BarcodeFormat.code39, BarcodeFormat.qrCode, BarcodeFormat.codabar],
  );

  String? _result;
  String? _error;
  List<String> _allocated = [];
  bool _busy = false;
  bool _torchOn = false;
  bool _handlingScan = false;
  DateTime? _lastScanAt;

  @override
  void dispose() {
    _ctrl.dispose();
    _scanner.dispose();
    super.dispose();
  }

  Future<void> _lookup([String? value]) async {
    final raw = (value ?? _ctrl.text).trim().toUpperCase();
    if (raw.isEmpty) return;
    if (!validateBarcode(raw)) {
      setState(() {
        _error = 'Invalid barcode check digit. Example: RDRKDURG000001W';
        _result = null;
      });
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
      _ctrl.text = raw;
    });
    try {
      final data = await ApiClient.instance.scanBarcode(raw);
      final unit = data['unit'] as Map<String, dynamic>?;
      setState(() {
        _result =
            '${unit?['barcode'] ?? raw} · ${unit?['blood_group'] ?? '—'} · ${unit?['lifecycle_state'] ?? '—'}';
      });
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      setState(() {
        _result = null;
        if (status == 404) {
          _error = 'No unit found for $raw';
        } else if (status == 401 || status == 403) {
          _error = 'Not allowed to scan units with this account.';
        } else if (e.type == DioExceptionType.connectionError) {
          _error = 'Cannot reach API. Check network.';
        } else {
          _error = 'Lookup failed${status != null ? ' ($status)' : ''}.';
        }
      });
    } catch (_) {
      setState(() {
        _error = 'Lookup failed for $raw';
        _result = null;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy || _handlingScan) return;
    final now = DateTime.now();
    if (_lastScanAt != null && now.difference(_lastScanAt!) < const Duration(seconds: 2)) {
      return;
    }
    final raw = capture.barcodes
        .map((b) => b.rawValue?.trim().toUpperCase())
        .whereType<String>()
        .firstWhere((v) => v.isNotEmpty, orElse: () => '');
    if (raw.isEmpty) return;
    _lastScanAt = now;
    _handlingScan = true;
    try {
      await _scanner.stop();
      await _lookup(raw);
    } finally {
      _handlingScan = false;
      if (mounted) {
        await _scanner.start();
      }
    }
  }

  Future<void> _preAllocate() async {
    final facilityId = ref.read(authProvider).facilityId;
    if (facilityId == null || facilityId.isEmpty) {
      setState(() => _error = 'No facility on this account — cannot pre-allocate.');
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
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      setState(() {
        if (status == 403) {
          _error = 'Pre-allocate requires clinical staff (not organizer).';
        } else {
          _error = 'Pre-allocate failed${status != null ? ' ($status)' : ''}.';
        }
      });
    } catch (_) {
      setState(() => _error = 'Pre-allocate failed');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return Scaffold(
      appBar: RaktAppBar(
        title: 'Scan barcode',
        showLogo: true,
        actions: [
          IconButton(
            tooltip: _torchOn ? 'Torch off' : 'Torch on',
            onPressed: () async {
              await _scanner.toggleTorch();
              setState(() => _torchOn = !_torchOn);
            },
            icon: Icon(_torchOn ? Icons.flash_on : Icons.flash_off),
          ),
          IconButton(
            tooltip: 'Pre-allocate 10',
            onPressed: _busy ? null : _preAllocate,
            icon: const Icon(Icons.download),
          ),
        ],
      ),
      body: ListView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + bottomInset),
        children: [
          SectionCard(
            title: 'Camera',
            subtitle: 'Point at a unit barcode. Manual entry works offline too.',
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 4 / 3,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    MobileScanner(
                      controller: _scanner,
                      onDetect: _onDetect,
                      errorBuilder: (context, error) {
                        return ColoredBox(
                          color: Colors.black87,
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text(
                                'Camera unavailable: ${error.errorCode.name}\n'
                                'Use manual entry below.',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.white, fontSize: 13),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    IgnorePointer(
                      child: Center(
                        child: Container(
                          width: 220,
                          height: 120,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white70, width: 2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            title: 'Manual entry',
            subtitle: '15-character NBTC-style code',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _ctrl,
                  enabled: !_busy,
                  decoration: const InputDecoration(
                    labelText: 'Barcode',
                    hintText: 'RDRKDURG000001W',
                    prefixIcon: Icon(Icons.qr_code_2),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _lookup(),
                ),
                const SizedBox(height: 12),
                PrimaryButton(
                  label: 'Lookup unit',
                  icon: Icons.search,
                  loading: _busy,
                  onPressed: () => _lookup(),
                ),
              ],
            ),
          ),
          if (_result != null) ...[
            const SizedBox(height: 12),
            SectionCard(
              title: 'Unit',
              child: Text(_result!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            ErrorBanner(_error!),
          ],
          if (_allocated.isNotEmpty) ...[
            const SizedBox(height: 12),
            SectionCard(
              title: 'Pre-allocated range',
              subtitle: '${_allocated.length} codes',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(child: QrImageView(data: _allocated.first, size: 132)),
                  const SizedBox(height: 12),
                  for (var i = 0; i < _allocated.length; i++) ...[
                    if (i > 0) const Divider(height: 1),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 28,
                            child: Text(
                              '${i + 1}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.muted,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              _allocated[i],
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.ink,
                                fontWeight: FontWeight.w500,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
