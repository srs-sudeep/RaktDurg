import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/remote/api_client.dart';
import '../auth/auth_notifier.dart';
import '../../widgets/branding_widgets.dart';

class CitizenHomeScreen extends ConsumerWidget {
  const CitizenHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RaktDurg'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.red.shade50.withValues(alpha: 0.5), Colors.grey.shade50],
          ),
        ),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFDC2626), Color(0xFFB91C1C)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.favorite, color: Colors.white, size: 34),
                  SizedBox(height: 12),
                  Text(
                    'Citizen dashboard',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Track your donor profile, wallet, camps, and donation history.',
                    style: TextStyle(color: Color(0xFFFECACA), fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _CitizenTile(
              icon: Icons.water_drop_outlined,
              color: const Color(0xFFDC2626),
              title: 'Blood Stock',
              subtitle: 'Check current public availability by group',
              onTap: () => context.push('/citizen/stock'),
            ),
            _CitizenTile(
              icon: Icons.account_balance_wallet_outlined,
              color: const Color(0xFF7C3AED),
              title: 'Wallet',
              subtitle: 'View blood credit balance and transactions',
              onTap: () => context.push('/citizen/wallet'),
            ),
            _CitizenTile(
              icon: Icons.event_available_outlined,
              color: const Color(0xFF059669),
              title: 'Camps',
              subtitle: 'Explore public donation camps and request booking',
              onTap: () => context.push('/citizen/camps'),
            ),
            _CitizenTile(
              icon: Icons.history_outlined,
              color: const Color(0xFFEA580C),
              title: 'Donation History',
              subtitle: 'See your past donations',
              onTap: () => context.push('/citizen/history'),
            ),
            _CitizenTile(
              icon: Icons.person_outline,
              color: const Color(0xFF2563EB),
              title: 'Profile',
              subtitle: 'View your linked donor profile',
              onTap: () => context.push('/citizen/profile'),
            ),
            _CitizenTile(
              icon: Icons.calendar_month_outlined,
              color: const Color(0xFF0F766E),
              title: 'My Bookings',
              subtitle: 'Track or cancel camp bookings',
              onTap: () => context.push('/citizen/bookings'),
            ),
          ],
        ),
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
      future: ApiClient.instance.getCitizenProfile(),
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _InfoCard(title: 'Name', value: '${data['name'] ?? '—'}'),
          _InfoCard(title: 'Blood Group', value: '${data['blood_group'] ?? '—'}'),
          _InfoCard(title: 'Phone', value: '${data['contact_phone'] ?? '—'}'),
          _InfoCard(title: 'Status', value: '${data['status'] ?? '—'}'),
          _InfoCard(title: 'ABHA', value: '${data['abha_reference'] ?? 'Not added'}'),
          _InfoCard(title: 'Address', value: '${data['address'] ?? '—'}'),
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
      future: ApiClient.instance.getCitizenWallet(),
      builder: (context, data) {
        final wallet = (data['wallet'] as Map<String, dynamic>? ?? {});
        final txns = (data['transactions'] as List<dynamic>? ?? []);
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Current balance', style: TextStyle(color: Colors.grey.shade600)),
                    const SizedBox(height: 8),
                    Text(
                      '${wallet['balance'] ?? 0}',
                      style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...txns.map((txn) {
              final item = txn as Map<String, dynamic>;
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  title: Text('${item['type'] ?? ''}'.toUpperCase()),
                  subtitle: Text('${item['recorded_at'] ?? ''}'),
                  trailing: Text('${item['amount'] ?? 0}'),
                ),
              );
            }),
            if (txns.isEmpty)
              Text('No wallet transactions yet.', style: TextStyle(color: Colors.grey.shade600)),
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
    return _CitizenAsyncPage<List<dynamic>>(
      title: 'Donation History',
      future: ApiClient.instance.getCitizenDonations(),
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          for (final item in data)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                title: Text('${(item as Map<String, dynamic>)['camp_name'] ?? 'Blood bank donation'}'),
                subtitle: Text('${item['location'] ?? ''}\n${item['collection_datetime'] ?? ''}'),
                isThreeLine: true,
                trailing: Text(item['volume_ml'] == null ? '—' : '${item['volume_ml']} ml'),
              ),
            ),
          if (data.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text('No donation history yet.', style: TextStyle(color: Colors.grey.shade600)),
            ),
        ],
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

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.getPublicCamps();
  }

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<List<dynamic>>(
      title: 'Upcoming Camps',
      future: _future,
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          for (final item in data)
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${(item as Map<String, dynamic>)['camp_name'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text('${item['host_facility_name'] ?? ''}', style: TextStyle(color: Colors.grey.shade600)),
                    const SizedBox(height: 4),
                    Text('${item['location'] ?? ''}', style: TextStyle(color: Colors.grey.shade700)),
                    const SizedBox(height: 4),
                    Text('${item['requested_date'] ?? ''}', style: TextStyle(color: Colors.grey.shade700)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () async {
                        await ApiClient.instance.createCitizenBooking(campId: '${item['id']}');
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Booking requested')),
                        );
                      },
                      child: const Text('Request booking'),
                    ),
                  ],
                ),
              ),
            ),
          if (data.isEmpty)
            Text('No approved upcoming camps yet.', style: TextStyle(color: Colors.grey.shade600)),
        ],
      ),
    );
  }
}

class CitizenBookingsScreen extends StatelessWidget {
  const CitizenBookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<List<dynamic>>(
      title: 'My Bookings',
      future: ApiClient.instance.getCitizenBookings(),
      builder: (context, data) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          for (final item in data)
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text('${(item as Map<String, dynamic>)['camp_name'] ?? ''}'),
                subtitle: Text('${item['location'] ?? ''}\n${item['requested_date'] ?? ''}'),
                isThreeLine: true,
                trailing: item['status'] == 'cancelled'
                    ? const Text('Cancelled')
                    : TextButton(
                        onPressed: () async {
                          await ApiClient.instance.cancelCitizenBooking('${item['id']}');
                          if (!context.mounted) return;
                          context.go('/citizen/bookings');
                        },
                        child: const Text('Cancel'),
                      ),
              ),
            ),
          if (data.isEmpty)
            Text('No camp bookings yet.', style: TextStyle(color: Colors.grey.shade600)),
        ],
      ),
    );
  }
}

class CitizenStockScreen extends StatelessWidget {
  const CitizenStockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _CitizenAsyncPage<Map<String, dynamic>>(
      title: 'Blood Stock',
      future: ApiClient.instance.getCitizenStock(),
      builder: (context, data) => _CitizenStockView(data: data),
    );
  }
}

class _CitizenStockView extends StatelessWidget {
  const _CitizenStockView({required this.data});

  final Map<String, dynamic> data;

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
      onRefresh: () async {
        if (!context.mounted) return;
        context.go('/citizen/stock');
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    data['facility_name'] as String? ?? 'Durg District Blood Bank',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Updated ${data['as_of'] ?? 'recently'}',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          ...grouped.entries.map((entry) {
            final total = entry.value.fold<int>(
              0,
              (sum, item) => sum + ((item['available_count'] as num?)?.toInt() ?? 0),
            );
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: total == 0 ? Colors.red.shade50 : Colors.green.shade50,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            entry.key,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: total == 0 ? Colors.red.shade700 : Colors.green.shade700,
                            ),
                          ),
                        ),
                        Text(
                          total == 0 ? 'Shortage' : '$total units',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: total == 0 ? Colors.red.shade700 : Colors.green.shade700,
                          ),
                        ),
                      ],
                    ),
                    if (entry.value.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: entry.value.map((item) {
                          final ct = '${item['component_type']}';
                          return Chip(
                            label: Text(
                              '${_componentLabels[ct] ?? ct}: ${item['available_count']}',
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            );
          }),
          if (entries.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text('No stock data available right now.', style: TextStyle(color: Colors.grey.shade600)),
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
  });

  final String title;
  final Future<T> future;
  final Widget Function(BuildContext context, T data) builder;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: FutureBuilder<T>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const PageLoader();
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Unable to load this screen right now.',
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ),
            );
          }
          return builder(context, snapshot.data as T);
        },
      ),
    );
  }
}

class _CitizenTile extends StatelessWidget {
  const _CitizenTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 2,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text(title),
        subtitle: Text(value),
      ),
    );
  }
}
