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
import 'features/citizen/citizen_screens.dart';
import 'features/donor/donor_register_screen.dart';
import 'features/donor/donor_select_screen.dart';
import 'features/screening/screening_form_screen.dart';
import 'features/sync/sync_manager.dart';
import 'features/sync/sync_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/branding_widgets.dart';
import 'widgets/shells.dart';

const _storage = FlutterSecureStorage();
const _fieldRoles = {'superadmin', 'district_admin', 'doctor', 'organizer'};

Future<String> _deviceId() async {
  var id = await _storage.read(key: 'device_id');
  if (id == null || id.isEmpty) {
    id = 'device-${DateTime.now().millisecondsSinceEpoch}';
    await _storage.write(key: 'device_id', value: id);
  }
  return id;
}

bool _isFieldRole(String? role) => role != null && _fieldRoles.contains(role);

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
        final loc = state.matchedLocation;
        final loggingIn = loc == '/login';
        if (auth.status == AuthStatus.loading) return null;
        if (!auth.isAuthenticated && !loggingIn) return '/login';
        if (auth.isAuthenticated && (loggingIn || loc == '/dashboard')) {
          return _isFieldRole(auth.role) ? '/field/home' : '/citizen/stock';
        }
        if (auth.isAuthenticated && loc.startsWith('/field') && !_isFieldRole(auth.role)) {
          return '/citizen/stock';
        }
        if (auth.isAuthenticated && loc.startsWith('/citizen') && _isFieldRole(auth.role) && loc == '/citizen') {
          return '/field/home';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/dashboard', redirect: (_, __) => '/field/home'),

        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) => FieldShell(navigationShell: navigationShell),
          branches: [
            StatefulShellBranch(
              routes: [GoRoute(path: '/field/home', builder: (_, __) => const FieldHomeScreen())],
            ),
            StatefulShellBranch(
              routes: [GoRoute(path: '/field/capture', builder: (_, __) => const CampSelectScreen())],
            ),
            StatefulShellBranch(
              routes: [GoRoute(path: '/field/scan', builder: (_, __) => const BarcodeScanScreen())],
            ),
            StatefulShellBranch(
              routes: [GoRoute(path: '/field/sync', builder: (_, __) => const SyncScreen())],
            ),
          ],
        ),

        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) => CitizenShell(navigationShell: navigationShell),
          branches: [
            StatefulShellBranch(
              routes: [GoRoute(path: '/citizen/stock', builder: (_, __) => const CitizenStockScreen())],
            ),
            StatefulShellBranch(
              routes: [GoRoute(path: '/citizen/camps', builder: (_, __) => const CitizenCampsScreen())],
            ),
            StatefulShellBranch(
              routes: [GoRoute(path: '/citizen/wallet', builder: (_, __) => const CitizenWalletScreen())],
            ),
            StatefulShellBranch(
              routes: [GoRoute(path: '/citizen/history', builder: (_, __) => const CitizenHistoryScreen())],
            ),
            StatefulShellBranch(
              routes: [GoRoute(path: '/citizen/account', builder: (_, __) => const CitizenAccountScreen())],
            ),
          ],
        ),

        GoRoute(path: '/citizen/profile', builder: (_, __) => const CitizenProfileScreen()),
        GoRoute(path: '/citizen/bookings', builder: (_, __) => const CitizenBookingsScreen()),
        GoRoute(path: '/donors/register', builder: (_, __) => const DonorRegisterScreen()),
        GoRoute(
          path: '/donors/select',
          builder: (_, state) => DonorSelectScreen(campId: state.uri.queryParameters['camp_id']),
        ),
        GoRoute(path: '/camps/select', redirect: (_, __) => '/field/capture'),
        GoRoute(path: '/barcode', redirect: (_, __) => '/field/scan'),
        GoRoute(path: '/sync', redirect: (_, __) => '/field/sync'),
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
      theme: buildRaktTheme(),
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
