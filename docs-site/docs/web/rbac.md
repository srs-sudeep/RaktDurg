---
id: rbac
title: Web RBAC
---

# Web RBAC

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

Citizen portal routes (`/my-account`, `/public/*`) are outside this map and use the citizen shell.

## Post-login redirects

| Role | Default route |
|------|---------------|
| `superadmin`, `district_admin`, `doctor` | `/dashboard` |
| `organizer` | `/camps` / apply flow |
| `citizen` | `/my-account` or public stock |

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
