import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  Droplets,
  LayoutDashboard,
  Menu,
  Tent,
  Users,
  ClipboardList,
  Wallet,
  Shield,
  Building2,
  BookUser,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BrandingFooter } from "@/components/Branding";
import { Button } from "@/components/ui/button";
import { canAccess, ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "ops",
    label: "Operations",
    items: [
      { path: "/dashboard", label: "Stock", icon: LayoutDashboard },
      { path: "/units", label: "Units", icon: Droplets },
      { path: "/donors", label: "Donors", icon: Users },
      { path: "/requisitions", label: "Requisitions", icon: ClipboardList },
      { path: "/wallet", label: "Wallet", icon: Wallet },
    ],
  },
  {
    id: "camps",
    label: "Camps",
    items: [
      { path: "/camps", label: "All camps", icon: Tent },
      { path: "/camps/apply", label: "Apply", icon: Activity },
      { path: "/camps/approval", label: "Approvals", icon: Shield },
      { path: "/camps/bookings", label: "Bookings", icon: BookUser },
    ],
  },
  {
    id: "directory",
    label: "Directory",
    items: [
      { path: "/organizers", label: "Organizer accounts", icon: Building2 },
      { path: "/organizer-directory", label: "Outreach list", icon: BookUser },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { path: "/users", label: "Users & roles", icon: Users },
      { path: "/admin", label: "System", icon: Shield },
    ],
  },
];

function SidebarNav({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => canAccess(role, item.path)),
      })).filter((section) => section.items.length > 0),
    [role]
  );

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {section.label}
          </p>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/camps" || item.path === "/admin"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-red-600 text-white shadow-sm shadow-red-600/20"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const role = user?.role as UserRole;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#14181f] text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <img src="/logo.svg" alt="RaktDurg" className="h-9 w-9 rounded-md bg-white/95 p-1" />
          <div>
            <div className="text-sm font-semibold tracking-tight">RaktDurg</div>
            <div className="text-[11px] text-slate-400">District blood bank</div>
          </div>
        </div>
        <SidebarNav role={role} />
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 truncate text-xs text-slate-400">
            {ROLE_LABELS[role] ?? role}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/15 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={() => void logout()}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#14181f] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="" className="h-8 w-8 rounded bg-white p-1" />
                <span className="font-semibold">RaktDurg</span>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded p-1 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-white/10 p-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/15 bg-transparent text-slate-200 hover:bg-white/10"
                onClick={() => void logout()}
              >
                Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-gray-700 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <div className="text-sm font-semibold text-gray-900">RaktDurg</div>
            </div>
            <div className="hidden text-sm text-gray-500 lg:block">
              Signed in as <span className="font-medium text-gray-800">{ROLE_LABELS[role] ?? role}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-gray-200 bg-white py-5">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <BrandingFooter />
          </div>
        </footer>
      </div>
    </div>
  );
}
