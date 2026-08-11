# rakt_durg_mobile

Flutter client for RaktDurg (offline screening, sync, staff login, citizen home).

## Who can sign in?

**Any demo role can log in.** Home screen depends on role:

| Role | Mobile experience |
|------|-------------------|
| `superadmin`, `district_admin`, `doctor` | Field dashboard (donor, screening, barcode, sync) |
| `organizer` | Sign-in OK — use **web** for camp apply; clinical APIs reject organizer |
| `citizen` | Citizen home (stock, wallet, camps, bookings) |

Full matrix: https://rakt-durg-docs.vercel.app/demo#who-can-sign-in-where

## Demo login

| Username | Password |
|----------|----------|
| `superadmin` | `super123` |
| `district_admin` | `district123` |
| `dr_meena` | `meena123` |
| `organizer_priya` | `priya123` |
| `citizen_ajay` | `ajay123` |

Do **not** use `seed_superadmin` against production.

## Run

```bash
cd mobile
flutter pub get

# Physical device / release against production (default in release mode):
flutter run --release --dart-define=API_BASE_URL=http://8.231.102.114

# Android emulator → local API:
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
```

Release builds from GitHub Actions inject `API_BASE_URL=http://8.231.102.114`. Older APKs without that define pointed at `10.0.2.2` and could not log in on real phones.

See [Mobile setup](https://rakt-durg-docs.vercel.app/mobile/setup) for layout, secure storage, and tests.
