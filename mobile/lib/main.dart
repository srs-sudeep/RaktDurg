import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/auth_notifier.dart';
import 'features/auth/login_screen.dart';
import 'features/barcode/barcode_scan_screen.dart';
import 'features/camp/camp_select_screen.dart';
import 'features/citizen/citizen_screens.dart';
import 'features/donor/donor_register_screen.dart';
import 'features/donor/donor_select_screen.dart';
import 'features/screening/screening_form_screen.dart';
import 'features/sync/sync_manager.dart';
import 'features/sync/sync_screen.dart';
import 'widgets/branding_widgets.dart';

const _storage = FlutterSecureStorage();

Future<String> _deviceId() async {
  var id = await _storage.read(key: 'device_id');
  if (id == null || id.isEmpty) {
    id = 'device-${DateTime.now().millisecondsSinceEpoch}';
    await _storage.write(key: 'device_id', value: id);
  }
  return id;
}

final _routerRefresh = ValueNotifier<int>(0);

void main() {
  runApp(const ProviderScope(child: RaktDurgApp()));
}

class RaktDurgApp extends ConsumerStatefulWidget {
  const RaktDurgApp({super.key});

  @override
  ConsumerState<RaktDurgApp> createState() => _RaktDurgAppState();
}

class _RaktDurgAppState extends ConsumerState<RaktDurgApp> {
  late final GoRouter _router;
  StreamSubscription? _connectivitySub;
  ProviderSubscription? _authSub;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/login',
      refreshListenable: _routerRefresh,
      redirect: (context, state) {
        final auth = ref.read(authProvider);
        final loggingIn = state.matchedLocation == '/login';
        if (auth.status == AuthStatus.loading) return null;
        if (!auth.isAuthenticated && !loggingIn) return '/login';
        if (auth.isAuthenticated && loggingIn) return '/dashboard';
        return null;
      },
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/dashboard', builder: (_, __) => const _RoleAwareHomeScreen()),
        GoRoute(path: '/sync', builder: (_, __) => const SyncScreen()),
        GoRoute(path: '/citizen/stock', builder: (_, __) => const CitizenStockScreen()),
        GoRoute(path: '/citizen/wallet', builder: (_, __) => const CitizenWalletScreen()),
        GoRoute(path: '/citizen/history', builder: (_, __) => const CitizenHistoryScreen()),
        GoRoute(path: '/citizen/profile', builder: (_, __) => const CitizenProfileScreen()),
        GoRoute(path: '/citizen/camps', builder: (_, __) => const CitizenCampsScreen()),
        GoRoute(path: '/citizen/bookings', builder: (_, __) => const CitizenBookingsScreen()),
        GoRoute(path: '/donors/register', builder: (_, __) => const DonorRegisterScreen()),
        GoRoute(
          path: '/donors/select',
          builder: (_, state) => DonorSelectScreen(campId: state.uri.queryParameters['camp_id']),
        ),
        GoRoute(path: '/camps/select', builder: (_, __) => const CampSelectScreen()),
        GoRoute(path: '/barcode', builder: (_, __) => const BarcodeScanScreen()),
        GoRoute(
          path: '/screening/:donorId',
          builder: (_, state) => FutureBuilder<String>(
            future: _deviceId(),
            builder: (context, snap) {
              if (!snap.hasData) {
                return const Scaffold(body: PageLoader());
              }
              return ScreeningFormScreen(
                donorId: state.pathParameters['donorId']!,
                deviceId: snap.data!,
                campId: state.uri.queryParameters['camp_id'],
              );
            },
          ),
        ),
      ],
    );

    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final online = results.any((r) => r != ConnectivityResult.none);
      if (online) {
        ref.read(syncManagerProvider.notifier).sync();
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    _authSub?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _authSub ??= ref.listenManual(authProvider, (_, __) {
      _routerRefresh.value++;
    });

    return MaterialApp.router(
      title: 'RaktDurg',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFDC2626),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      ),
      builder: (context, child) {
        final auth = ref.watch(authProvider);
        if (auth.status == AuthStatus.loading) {
          return const SplashScreen(message: 'Starting up…');
        }
        return child ?? const SizedBox.shrink();
      },
      routerConfig: _router,
    );
  }
}

class _RoleAwareHomeScreen extends ConsumerWidget {
  const _RoleAwareHomeScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    const fieldRoles = {'superadmin', 'district_admin', 'doctor', 'organizer'};
    final canUseFieldApp = auth.role != null && fieldRoles.contains(auth.role);
    return canUseFieldApp ? const _DashboardScreen() : const CitizenHomeScreen();
  }
}

class _DashboardScreen extends ConsumerWidget {
  const _DashboardScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    const fieldRoles = {'superadmin', 'district_admin', 'doctor', 'organizer'};
    final canUseFieldApp = auth.role != null && fieldRoles.contains(auth.role);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset('assets/logo.svg', width: 28, height: 28),
            const SizedBox(width: 8),
            const Text('RaktDurg'),
          ],
        ),
        backgroundColor: const Color(0xFFDC2626),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sync',
            onPressed: () => context.push('/sync'),
          ),
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
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFDC2626), Color(0xFFB91C1C)]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.bloodtype, color: Colors.white, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Field dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Camp & donor capture tools', style: TextStyle(color: Colors.red.shade100, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (canUseFieldApp) ...[
              _tile(context, Icons.person_add, 'Register Donor', 'Register a new blood donor', const Color(0xFFDC2626),
                  () => context.push('/donors/register')),
              _tile(context, Icons.health_and_safety, 'Screening', 'Select donor / camp then screen', const Color(0xFFEA580C),
                  () => context.push('/camps/select')),
              _tile(context, Icons.qr_code_scanner, 'Scan Barcode', 'Look up a blood unit by barcode', const Color(0xFF7C3AED),
                  () => context.push('/barcode')),
              _tile(context, Icons.cloud_upload, 'Sync Offline Data', 'Upload pending records to the server', const Color(0xFF059669),
                  () => context.push('/sync')),
            ] else ...[
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(Icons.public, size: 48, color: Colors.red.shade300),
                      const SizedBox(height: 12),
                      const Text(
                        'Citizen accounts use the web app for public stock and wallet.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text('Field features are for district staff only.', style: TextStyle(color: Colors.grey.shade600, fontSize: 13), textAlign: TextAlign.center),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 20),
            Text(
              'Signed in as: ${auth.role ?? "unknown"}',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    Color accent,
    VoidCallback onTap,
  ) {
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
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: accent, size: 26),
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
