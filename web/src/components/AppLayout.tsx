import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canAccess, ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandingFooter } from "@/components/Branding";

const NAV: { path: string; label: string }[] = [
  { path: "/dashboard", label: "Stock" },
  { path: "/units", label: "Units" },
  { path: "/donors", label: "Donors" },
  { path: "/camps", label: "Camps" },
  { path: "/requisitions", label: "Requisitions" },
  { path: "/wallet", label: "Wallet" },
  { path: "/admin", label: "Admin" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const role = user?.role as UserRole;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="RaktDurg" className="h-8 w-8" />
              <span className="font-semibold text-gray-900">RaktDurg</span>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.filter((item) => canAccess(role, item.path)).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100",
                      isActive && "bg-red-50 text-red-700"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">
              {ROLE_LABELS[role] ?? role}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-6">
        <BrandingFooter />
      </footer>
    </div>
  );
}
