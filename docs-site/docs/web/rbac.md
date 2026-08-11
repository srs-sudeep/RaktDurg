---
id: rbac
title: Web RBAC
---

# Web RBAC

## Can every role log in on web?

**Yes.** Web login (`/login`) uses the same JWT API as mobile. After login, the app redirects by role and hides staff sidebar items the role cannot access.

| Role | After login | Shell |
|------|-------------|-------|
| `superadmin`, `district_admin`, `doctor` | `/dashboard` | Staff (`AppLayout`) |
| `organizer` | `/dashboard` (camps-focused menus) | Staff — mainly Camps / Apply |
| `citizen` | `/my-account` | `CitizenShell` (not the staff sidebar) |

Public marketing / stock pages do not require auth.

See also [Demo — who can sign in where](../demo.md#who-can-sign-in-where) and [Architecture RBAC](../architecture/rbac.md).

## Role Definitions

```typescript
// web/src/lib/rbac.ts
export const USER_ROLES = [
  "superadmin",
  "district_admin",
  "doctor",
  "organizer",
  "citizen",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
```

`superadmin` always passes `canAccess()` for staff paths.

## Route Permissions

```typescript
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["superadmin", "district_admin", "doctor", "organizer"],
  "/profile": ["superadmin", "district_admin", "doctor", "organizer"],
  "/units": ["superadmin", "district_admin", "doctor"],
  "/donors": ["superadmin", "district_admin", "doctor"],
  "/camps": ["superadmin", "doctor", "organizer", "district_admin"],
  "/camps/approval": ["superadmin", "doctor"],
  "/camps/bookings": ["superadmin", "doctor", "district_admin"],
  "/camps/apply": ["organizer", "superadmin"],
  "/requisitions": ["superadmin", "doctor", "district_admin"],
  "/wallet": ["superadmin", "doctor", "district_admin"],
  "/organizers": ["superadmin", "district_admin", "doctor"],
  "/organizer-directory": ["superadmin", "district_admin", "doctor"],
  "/citizens/link": ["superadmin", "district_admin", "doctor"],
  "/users": ["superadmin"],
  "/admin": ["superadmin"],
};
```

### Quick matrix (web)

| Path / area | superadmin | district_admin | doctor | organizer | citizen |
|-------------|:----------:|:--------------:|:------:|:---------:|:-------:|
| Staff dashboard | ✓ | ✓ | ✓ | ✓ | → citizen portal |
| Units / donors | ✓ | ✓ | ✓ | ✗ | ✗ |
| Requisitions / staff wallet | ✓ | ✓ | ✓ | ✗ | ✗ |
| Camps list | ✓ | ✓ | ✓ | ✓ | ✗ |
| Camp apply | ✓ | ✗ | ✗ | ✓ | ✗ |
| Camp approvals | ✓ | ✗ | ✓ | ✗ | ✗ |
| Booking queue | ✓ | ✓ | ✓ | ✗ | ✗ |
| Organizers / link citizen | ✓ | ✓ | ✓ | ✗ | ✗ |
| Users / system admin | ✓ | ✗ | ✗ | ✗ | ✗ |
| `/my-account/*` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `/public/*` (no login) | ✓ | ✓ | ✓ | ✓ | ✓ |

Citizen portal routes (`/my-account`, `/public/*`) are outside `ROUTE_ROLES` and use the citizen shell (or public layout).

## Post-login redirects

| Role | Default route (`defaultRouteForRole`) |
|------|----------------------------------------|
| `citizen` | `/my-account` |
| All other roles | `/dashboard` |

## ProtectedRoute

```typescript
// web/src/components/ProtectedRoute.tsx
// Redirects unauthenticated users to /login
// Redirects wrong-role users away from gated paths
```

Sidebar sections in `AppLayout` filter items with `canAccess(role, path)`.

## Related

- [Staff UI & Tables](./staff-ui.md)
- [Architecture RBAC](../architecture/rbac.md)
- [Mobile setup — roles](../mobile/setup.md#roles--access)
