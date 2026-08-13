import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/auth_notifier.dart';
import '../theme/app_theme.dart';
import 'ui_kit.dart';

class FieldShell extends ConsumerWidget {
  const FieldShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.health_and_safety_outlined),
            selectedIcon: Icon(Icons.health_and_safety),
            label: 'Capture',
          ),
          NavigationDestination(icon: Icon(Icons.qr_code_scanner), selectedIcon: Icon(Icons.qr_code_scanner), label: 'Scan'),
          NavigationDestination(icon: Icon(Icons.cloud_upload_outlined), selectedIcon: Icon(Icons.cloud_upload), label: 'Sync'),
        ],
      ),
    );
  }
}

class CitizenShell extends ConsumerWidget {
  const CitizenShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.water_drop_outlined), selectedIcon: Icon(Icons.water_drop), label: 'Stock'),
          NavigationDestination(icon: Icon(Icons.event_available_outlined), selectedIcon: Icon(Icons.event_available), label: 'Camps'),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Wallet',
          ),
          NavigationDestination(icon: Icon(Icons.history), selectedIcon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
        ],
      ),
    );
  }
}

class FieldHomeScreen extends ConsumerWidget {
  const FieldHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return PageScaffold(
      title: 'RaktDurg',
      showLogo: true,
      actions: [
        IconButton(
          tooltip: 'Sign out',
          onPressed: () => ref.read(authProvider.notifier).logout(),
          icon: const Icon(Icons.logout),
        ),
      ],
      body: ListView(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.brandDark,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Field operations',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
                ),
                const SizedBox(height: 4),
                Text(
                  'Signed in as ${auth.role ?? 'staff'}',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          ListRowCard(
            leading: const IconBadge(Icons.person_add, AppColors.brand),
            title: 'Register donor',
            subtitle: 'Create a new donor record',
            onTap: () => context.push('/donors/register'),
          ),
          const SizedBox(height: 8),
          ListRowCard(
            leading: const IconBadge(Icons.health_and_safety, AppColors.warning),
            title: 'Start screening',
            subtitle: 'Pick camp → donor → vitals form',
            onTap: () => context.go('/field/capture'),
          ),
          const SizedBox(height: 8),
          ListRowCard(
            leading: const IconBadge(Icons.qr_code_scanner, AppColors.ink),
            title: 'Scan barcode',
            subtitle: 'Camera lookup or manual entry',
            onTap: () => context.go('/field/scan'),
          ),
          const SizedBox(height: 8),
          ListRowCard(
            leading: const IconBadge(Icons.cloud_upload, AppColors.success),
            title: 'Sync offline data',
            subtitle: 'Upload pending screenings',
            onTap: () => context.go('/field/sync'),
          ),
        ],
      ),
    );
  }
}

class CitizenAccountScreen extends ConsumerWidget {
  const CitizenAccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PageScaffold(
      title: 'Account',
      showLogo: true,
      actions: [
        IconButton(
          tooltip: 'Sign out',
          onPressed: () => ref.read(authProvider.notifier).logout(),
          icon: const Icon(Icons.logout),
        ),
      ],
      body: ListView(
        children: [
          ListRowCard(
            leading: const IconBadge(Icons.person_outline, AppColors.brand),
            title: 'Donor profile',
            subtitle: 'Linked donor details',
            onTap: () => context.push('/citizen/profile'),
          ),
          const SizedBox(height: 8),
          ListRowCard(
            leading: const IconBadge(Icons.calendar_month_outlined, AppColors.success),
            title: 'My bookings',
            subtitle: 'Track or cancel camp bookings',
            onTap: () => context.push('/citizen/bookings'),
          ),
        ],
      ),
    );
  }
}
