---
id: setup
title: Mobile Setup
---

# Mobile (Flutter) Setup

## Requirements

| Tool | Version |
|------|---------|
| Flutter SDK | 3.x |
| Dart | 3.x |
| Android Studio or Xcode | Latest stable |

## Project Layout

```
mobile/
├── lib/
│   ├── data/
│   │   ├── local/
│   │   │   ├── database.dart          # sqflite schema + init
│   │   │   └── dao/
│   │   │       └── screening_dao.dart # CRUD for offline screenings
│   │   └── remote/
│   │       └── api_client.dart        # Dio singleton + interceptors
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth_notifier.dart     # StateNotifier, JWT decode
│   │   │   └── login_screen.dart
│   │   ├── screening/
│   │   │   └── screening_form_screen.dart
│   │   └── sync/
│   │       ├── sync_manager.dart      # batch sync logic
│   │       └── sync_screen.dart
│   └── main.dart                      # ProviderScope + GoRouter
├── pubspec.yaml
└── test/
```

## Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  riverpod: ^2.5
  go_router: ^13.0
  dio: ^5.4
  flutter_secure_storage: ^9.0
  sqflite: ^2.3
  path: ^1.9
  mobile_scanner: ^5.0
  qr_flutter: ^4.1
  uuid: ^4.4

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0
```

## Running the App

```bash
cd mobile
flutter pub get
flutter run                    # connect a device or start emulator first
```

Or via Make:
```bash
make flutter-get
make flutter-build
```

## API Base URL

The API URL is configured in `api_client.dart`:

```dart
static const _baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8000',  // Android emulator → localhost
);
```

For a real device on the same WiFi:
```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.x:8000
```

Production / physical device against the live API:
```bash
flutter run --dart-define=API_BASE_URL=http://8.231.102.114
# Release builds default to this URL when no dart-define is passed.
```

CI release builds also inject `--dart-define=API_BASE_URL=http://8.231.102.114`.

## Roles & access

Any demo account can **sign in** on mobile (same JSON login as web). The home screen depends on JWT `role`:

| Role | Mobile home | Notes |
|------|-------------|-------|
| `superadmin`, `district_admin`, `doctor` | Field dashboard | Register donor, screening, barcode, offline sync |
| `organizer` | Field dashboard UI | Prefer **web** for `/camps/apply` — donor/screening/sync APIs return 403 for organizers |
| `citizen` | Citizen home | Stock, wallet, camps, bookings, history, profile |

Full matrix: [Demo — who can sign in where](../demo.md#who-can-sign-in-where) · [Architecture RBAC](../architecture/rbac.md).

## Demo login

Same accounts as the web app after `demo_seed` (JSON `POST /auth/token`):

| Username | Password | Role | Use on mobile for |
|----------|----------|------|-------------------|
| `superadmin` | `super123` | superadmin | Field tools |
| `district_admin` | `district123` | district_admin | Field tools |
| `dr_meena` | `meena123` | doctor | Field tools |
| `organizer_priya` | `priya123` | organizer | Sign-in OK; camp apply on **web** |
| `citizen_ajay` | `ajay123` | citizen | Citizen home |

Do not use `seed_superadmin` against production. Full table: [Demo & Live Links](../demo.md).

## Secure Storage

Auth tokens are stored in the device's secure storage:
- Android: Android Keystore
- iOS: Keychain

```dart
final _storage = const FlutterSecureStorage();
await _storage.write(key: 'access_token', value: token);
final token = await _storage.read(key: 'access_token');
```

## Tests

```bash
flutter test
# or
make flutter-test
```

Static analysis:
```bash
flutter analyze
# or
make flutter-analyze
```
