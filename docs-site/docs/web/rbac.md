---
id: rbac
title: Web RBAC
---

# Web RBAC

## Role Definitions

```typescript
// web/src/lib/rbac.ts
export const USER_ROLES = [
  "admin",
  "medical_officer",
  "lab_tech",
  "phlebotomist",
  "inventory_officer",
  "organizer",
  "donor",
  "citizen_read",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
```

## Route Permissions

```typescript
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard":    ["admin","medical_officer","lab_tech","phlebotomist","inventory_officer"],
  "/units":        ["admin","medical_officer","lab_tech"],
  "/donors":       ["admin","medical_officer","lab_tech","phlebotomist"],
  "/camps":        ["admin","medical_officer","organizer"],
  "/requisitions": ["admin","medical_officer","inventory_officer"],
  "/wallet":       ["admin","medical_officer","donor"],
  "/admin":        ["admin"],
};

export function canAccess(role: UserRole, path: string): boolean {
  const allowed = ROUTE_ROLES[path];
  if (!allowed) return true; // public route
  return allowed.includes(role);
}
```

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

## Usage in Router

```typescript
// web/src/routes/index.tsx
const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/public/stock", element: <PublicStockPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute
        roles={["admin","medical_officer","lab_tech","phlebotomist","inventory_officer"]}
      >
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
]);
```

## Role-Based UI Elements

Use `canAccess()` or direct role checks to conditionally render UI:

```typescript
const { user } = useAuth();

// Show admin panel link only for admin
{user?.role === "admin" && <Link to="/admin">Admin Panel</Link>}

// Show wallet tab for eligible roles
{canAccess(user?.role, "/wallet") && <WalletTab />}
```
