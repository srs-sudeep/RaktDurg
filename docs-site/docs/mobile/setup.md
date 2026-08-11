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

Production / emulator against the live API:
```bash
flutter run --dart-define=API_BASE_URL=http://8.231.102.114
```

## Demo login

Same accounts as the web app after `demo_seed` (JSON `POST /auth/token`):

| Username | Password |
|----------|----------|
| `superadmin` | `super123` |
| `dr_meena` | `meena123` |
| `organizer_priya` | `priya123` |
| `citizen_ajay` | `ajay123` |

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
