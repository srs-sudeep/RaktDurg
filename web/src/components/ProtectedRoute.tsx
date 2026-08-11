import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROUTE_ROLES, type UserRole } from "@/lib/rbac";

function rolesForPath(pathname: string): UserRole[] | null {
  if (ROUTE_ROLES[pathname]) return ROUTE_ROLES[pathname];
  const key = Object.keys(ROUTE_ROLES)
    .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
  return key ? ROUTE_ROLES[key] : null;
}

/** Requires login; enforces ROUTE_ROLES for the current path when defined. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }

  const required = rolesForPath(pathname);
  if (required && !required.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
