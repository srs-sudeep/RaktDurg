# rakt_durg_mobile

Flutter client for RaktDurg (offline screening, sync, staff login).

## Demo login

Same accounts as the web app after `demo_seed`:

| Username | Password |
|----------|----------|
| `superadmin` | `super123` |
| `dr_meena` | `meena123` |
| `organizer_priya` | `priya123` |
| `citizen_ajay` | `ajay123` |

Do **not** use `seed_superadmin` against production. Full list: https://rakt-durg-docs.vercel.app/demo

## Run

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://8.231.102.114   # production
# or local API (Android emulator):
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
```

See [Mobile setup](https://rakt-durg-docs.vercel.app/mobile/setup) for layout, secure storage, and tests.
