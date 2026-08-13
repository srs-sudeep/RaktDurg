import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';

import '../../data/remote/api_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/branding_widgets.dart';
import '../../widgets/ui_kit.dart';

/// Legacy hub — bottom nav is canonical. Kept so old deep links can show a note.
class CitizenHomeScreen extends StatelessWidget {
  const CitizenHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PageScaffold(
      title: 'RaktDurg',
      showLogo: true,
      body: EmptyState(
        message: 'Use the bottom navigation to open Stock, Camps, Wallet, History, or Account.',
        icon: Icons.navigation_outlined,
      ),
    );
  }
}

class CitizenProfileScreen extends StatelessWidget {
  const CitizenProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<Map<String, dynamic>>(
      title: 'Donor Profile',
      showLogo: false,
      future: ApiClient.instance.getCitizenProfile(),
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            title: 'Profile',
            child: InfoTable(
              rows: [
                ('Name', '${data['name'] ?? '—'}'),
                ('Blood Group', '${data['blood_group'] ?? '—'}'),
                ('Phone', '${data['contact_phone'] ?? '—'}'),
                ('Status', '${data['status'] ?? '—'}'),
                ('ABHA', '${data['abha_reference'] ?? 'Not added'}'),
                ('Address', '${data['address'] ?? '—'}'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CitizenWalletScreen extends StatelessWidget {
  const CitizenWalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<Map<String, dynamic>>(
      title: 'Blood Credit Wallet',
      showLogo: true,
      future: ApiClient.instance.getCitizenWallet(),
      builder: (context, data) {
        final wallet = (data['wallet'] as Map<String, dynamic>? ?? {});
        final txns = (data['transactions'] as List<dynamic>? ?? []);
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SectionCard(
              title: 'Current balance',
              child: Text(
                '${wallet['balance'] ?? 0}',
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: AppColors.ink),
              ),
            ),
            const SizedBox(height: 12),
            if (txns.isEmpty)
              const EmptyState(message: 'No wallet transactions yet.', icon: Icons.account_balance_wallet_outlined)
            else
              ...txns.map((txn) {
                final item = txn as Map<String, dynamic>;
                final type = '${item['type'] ?? ''}'.toUpperCase();
                final amount = item['amount'] as num? ?? 0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: ListRowCard(
                    leading: IconBadge(
                      amount >= 0 ? Icons.arrow_downward : Icons.arrow_upward,
                      amount >= 0 ? AppColors.success : AppColors.danger,
                    ),
                    title: type.isEmpty ? 'Transaction' : type,
                    subtitle: '${item['recorded_at'] ?? ''}',
                    trailing: StatusChip(
                      '${item['amount'] ?? 0}',
                      tone: amount >= 0 ? StatusTone.success : StatusTone.danger,
                    ),
                  ),
                );
              }),
          ],
        );
      },
    );
  }
}

class CitizenHistoryScreen extends StatelessWidget {
  const CitizenHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<_HistoryBundle>(
      title: 'Donation History',
      showLogo: true,
      future: () async {
        final donations = await ApiClient.instance.getCitizenDonations();
        final certificates = await ApiClient.instance.getCitizenCertificates();
        return _HistoryBundle(donations: donations, certificates: certificates);
      }(),
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Donations', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 8),
          if (data.donations.isEmpty)
            const Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: EmptyState(message: 'No donation history yet.', icon: Icons.history),
            )
          else
            for (final raw in data.donations)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ListRowCard(
                  leading: const IconBadge(Icons.bloodtype_outlined, AppColors.brand),
                  title: '${(raw as Map<String, dynamic>)['camp_name'] ?? 'Blood bank donation'}',
                  subtitle: '${raw['location'] ?? ''}\n${raw['collection_datetime'] ?? ''}',
                  trailing: StatusChip(
                    raw['volume_ml'] == null ? '—' : '${raw['volume_ml']} ml',
                    tone: StatusTone.neutral,
                  ),
                ),
              ),
          const SizedBox(height: 12),
          const Text('Certificates', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 8),
          if (data.certificates.isEmpty)
            const EmptyState(
              message: 'Certificates appear after a donation is recorded.',
              icon: Icons.workspace_premium_outlined,
            )
          else
            for (final raw in data.certificates)
              _CertificateTile(cert: raw as Map<String, dynamic>),
        ],
      ),
    );
  }
}

class _HistoryBundle {
  const _HistoryBundle({required this.donations, required this.certificates});
  final List<dynamic> donations;
  final List<dynamic> certificates;
}

class _CertificateTile extends StatefulWidget {
  const _CertificateTile({required this.cert});
  final Map<String, dynamic> cert;

  @override
  State<_CertificateTile> createState() => _CertificateTileState();
}

class _CertificateTileState extends State<_CertificateTile> {
  bool _busy = false;

  Future<void> _download() async {
    setState(() => _busy = true);
    try {
      final id = widget.cert['id'] as String;
      final number = (widget.cert['certificate_number'] as String?) ?? 'certificate';
      final bytes = await ApiClient.instance.downloadCitizenCertificatePdf(id);
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/$number.pdf');
      await file.writeAsBytes(bytes, flush: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Certificate saved to ${file.path}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Download failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cert = widget.cert;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: ListRowCard(
        leading: const IconBadge(Icons.workspace_premium_outlined, AppColors.warning),
        title: '${cert['certificate_number'] ?? 'Certificate'}',
        subtitle: '${cert['donor_name'] ?? ''} · ${cert['blood_group'] ?? '—'} · ${cert['donation_date'] ?? ''}',
        trailing: TextButton(
          onPressed: _busy ? null : _download,
          child: Text(_busy ? '…' : 'PDF'),
        ),
      ),
    );
  }
}

class CitizenCampsScreen extends StatefulWidget {
  const CitizenCampsScreen({super.key});

  @override
  State<CitizenCampsScreen> createState() => _CitizenCampsScreenState();
}

class _CitizenCampsScreenState extends State<CitizenCampsScreen> {
  late Future<List<dynamic>> _future;
  String? _bookingError;
  String? _bookingCampId;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.getPublicCamps();
  }

  Future<void> _requestBooking(String campId) async {
    setState(() {
      _bookingCampId = campId;
      _bookingError = null;
    });
    try {
      await ApiClient.instance.createCitizenBooking(campId: campId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking requested')),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _bookingError = 'Could not request booking. Try again.');
    } finally {
      if (mounted) setState(() => _bookingCampId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<List<dynamic>>(
      title: 'Upcoming Camps',
      showLogo: true,
      future: _future,
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_bookingError != null) ...[
            ErrorBanner(_bookingError!),
            const SizedBox(height: 12),
          ],
          if (data.isEmpty)
            const EmptyState(message: 'No approved upcoming camps yet.', icon: Icons.event_busy)
          else
            for (final raw in data)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ListRowCard(
                  leading: const IconBadge(Icons.event_available_outlined, AppColors.success),
                  title: '${(raw as Map<String, dynamic>)['camp_name'] ?? ''}',
                  subtitle:
                      '${raw['host_facility_name'] ?? ''}\n${raw['location'] ?? ''}\n${raw['requested_date'] ?? ''}',
                  trailing: TextButton(
                    onPressed: _bookingCampId != null
                        ? null
                        : () => _requestBooking('${raw['id']}'),
                    child: Text(_bookingCampId == '${raw['id']}' ? '…' : 'Book'),
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

class CitizenBookingsScreen extends StatefulWidget {
  const CitizenBookingsScreen({super.key});

  @override
  State<CitizenBookingsScreen> createState() => _CitizenBookingsScreenState();
}

class _CitizenBookingsScreenState extends State<CitizenBookingsScreen> {
  late Future<List<dynamic>> _future;
  String? _error;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _error = null;
      _future = ApiClient.instance.getCitizenBookings();
    });
  }

  Future<void> _cancel(String id) async {
    try {
      await ApiClient.instance.cancelCitizenBooking(id);
      if (!mounted) return;
      _reload();
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not cancel booking.');
    }
  }

  StatusTone _toneFor(String status) {
    return switch (status) {
      'confirmed' || 'approved' => StatusTone.success,
      'cancelled' => StatusTone.danger,
      'pending' || 'requested' => StatusTone.warning,
      _ => StatusTone.neutral,
    };
  }

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<List<dynamic>>(
      title: 'My Bookings',
      showLogo: false,
      future: _future,
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_error != null) ...[
            ErrorBanner(_error!),
            const SizedBox(height: 12),
          ],
          if (data.isEmpty)
            const EmptyState(message: 'No camp bookings yet.', icon: Icons.calendar_month_outlined)
          else
            for (final raw in data)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ListRowCard(
                  leading: const IconBadge(Icons.calendar_month_outlined, AppColors.brand),
                  title: '${(raw as Map<String, dynamic>)['camp_name'] ?? ''}',
                  subtitle: '${raw['location'] ?? ''}\n${raw['requested_date'] ?? ''}',
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      StatusChip(
                        '${raw['status'] ?? '—'}',
                        tone: _toneFor('${raw['status'] ?? ''}'),
                      ),
                      if (raw['status'] != 'cancelled') ...[
                        const SizedBox(width: 4),
                        TextButton(
                          onPressed: () => _cancel('${raw['id']}'),
                          child: const Text('Cancel'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

class CitizenStockScreen extends StatefulWidget {
  const CitizenStockScreen({super.key});

  @override
  State<CitizenStockScreen> createState() => _CitizenStockScreenState();
}

class _CitizenStockScreenState extends State<CitizenStockScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _future = ApiClient.instance.getCitizenStock();
    });
  }

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<Map<String, dynamic>>(
      title: 'Blood Stock',
      showLogo: true,
      future: _future,
      builder: (context, data) => _CitizenStockView(data: data, onRefresh: () async => _reload()),
    );
  }
}

class _CitizenStockView extends StatelessWidget {
  const _CitizenStockView({required this.data, required this.onRefresh});

  final Map<String, dynamic> data;
  final Future<void> Function() onRefresh;

  static const _componentLabels = {
    'whole_blood': 'Whole Blood',
    'prbc': 'PRBC',
    'platelets': 'Platelets',
    'ffp': 'FFP',
    'cryo': 'Cryo',
    'granulocytes': 'Granulocytes',
  };

  @override
  Widget build(BuildContext context) {
    final entries = (data['entries'] as List<dynamic>? ?? []);
    final grouped = <String, List<Map<String, dynamic>>>{};
    for (final raw in entries) {
      final item = raw as Map<String, dynamic>;
      final bg = '${item['blood_group']}';
      grouped.putIfAbsent(bg, () => []).add(item);
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          ListRowCard(
            leading: const IconBadge(Icons.local_hospital_outlined, AppColors.brand),
            title: data['facility_name'] as String? ?? 'Durg District Blood Bank',
            subtitle: 'Updated ${data['as_of'] ?? 'recently'}',
          ),
          const SizedBox(height: 12),
          if (entries.isEmpty)
            const EmptyState(message: 'No stock data available right now.', icon: Icons.water_drop_outlined)
          else
            for (final entry in grouped.entries)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: SectionCard(
                  title: entry.key,
                  trailing: Builder(
                    builder: (_) {
                      final total = entry.value.fold<int>(
                        0,
                        (sum, item) => sum + ((item['available_count'] as num?)?.toInt() ?? 0),
                      );
                      return StatusChip(
                        total == 0 ? 'Shortage' : '$total units',
                        tone: total == 0 ? StatusTone.danger : StatusTone.success,
                      );
                    },
                  ),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final item in entry.value)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.canvas,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.line),
                          ),
                          child: Text(
                            '${_componentLabels['${item['component_type']}'] ?? item['component_type']}: ${item['available_count'] ?? 0}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.ink,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

class _CitizenAsyncPage<T> extends StatelessWidget {
  const _CitizenAsyncPage({
    required this.title,
    required this.future,
    required this.builder,
    this.showLogo = false,
  });

  final String title;
  final Future<T> future;
  final Widget Function(BuildContext context, T data) builder;
  final bool showLogo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: RaktAppBar(title: title, showLogo: showLogo),
      body: FutureBuilder<T>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const PageLoader();
          }
          if (snapshot.hasError) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: ErrorBanner('Unable to load this screen right now.'),
            );
          }
          if (!snapshot.hasData) {
            return const EmptyState(message: 'Unable to load this screen right now.');
          }
          return builder(context, snapshot.data as T);
        },
      ),
    );
  }
}
