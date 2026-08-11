import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/auth_notifier.dart';
import 'features/auth/login_screen.dart';
import 'features/barcode/barcode_scan_screen.dart';
import 'features/camp/camp_select_screen.dart';
import 'features/donor/donor_register_screen.dart';
import 'features/donor/donor_select_screen.dart';
import 'features/screening/screening_form_screen.dart';
import 'features/sync/sync_manager.dart';
import 'features/sync/sync_screen.dart';

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
        GoRoute(path: '/dashboard', builder: (_, __) => const _DashboardScreen()),
        GoRoute(path: '/sync', builder: (_, __) => const SyncScreen()),
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
                return const Scaffold(body: Center(child: CircularProgressIndicator()));
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
      routerConfig: _router,
    );
  }
}

class _DashboardScreen extends ConsumerWidget {
  const _DashboardScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/logo.png', width: 28, height: 28),
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _tile(context, Icons.person_add, 'Register Donor', 'Register a new blood donor',
              () => context.push('/donors/register')),
          _tile(context, Icons.health_and_safety, 'Screening', 'Select donor / camp then screen',
              () => context.push('/camps/select')),
          _tile(context, Icons.qr_code_scanner, 'Scan Barcode', 'Look up a blood unit by barcode',
              () => context.push('/barcode')),
          _tile(context, Icons.cloud_upload, 'Sync Offline Data', 'Upload pending records to the server',
              () => context.push('/sync')),
          const SizedBox(height: 20),
          Text(
            'Signed in as: ${auth.role ?? "unknown"}',
            style: const TextStyle(color: Colors.grey, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFFDC2626)),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
