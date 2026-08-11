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

## Route Permissions

```typescript
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard":    ["superadmin", "district_admin", "doctor"],
  "/units":        ["superadmin", "district_admin", "doctor"],
  "/donors":       ["superadmin", "district_admin", "doctor"],
  "/camps":        ["superadmin", "doctor", "organizer", "district_admin"],
  "/camps/approval": ["superadmin", "doctor"],
  "/camps/apply":  ["organizer", "superadmin"],
  "/requisitions": ["superadmin", "doctor", "district_admin"],
  "/wallet":       ["superadmin", "doctor", "citizen"],
  "/admin":        ["superadmin"],
};

export function canAccess(role: UserRole, path: string): boolean {
  const allowed = ROUTE_ROLES[path];
  if (!allowed) return true; // public route
  return allowed.includes(role);
}
```

## Post-login redirects

| Role | Default route |
|------|---------------|
| `superadmin`, `district_admin`, `doctor` | `/dashboard` |
| `organizer` | `/camps/apply` |
| `citizen` | `/public/stock` |

## ProtectedRoute Component

```typescript
// web/src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  roles?: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

## Role-Based UI Elements

```typescript
const { user } = useAuth();

{user?.role === "superadmin" && <Link to="/admin">Admin Panel</Link>}

{canAccess(user?.role, "/wallet") && <WalletTab />}
```
