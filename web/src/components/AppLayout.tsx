import { useMemo, useState, type ComponentType } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
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
  UserRound,
  ChevronDown,
  UserPlus,
  Settings2,
} from "lucide-react";
import { useAuthMe } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { pageMetaForPath } from "@/lib/page-meta";
import { canAccess, ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type NavItem = {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
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
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
      { path: "/citizens/link", label: "Link citizen", icon: UserPlus },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { path: "/users", label: "Users & roles", icon: Users },
      { path: "/admin", label: "System", icon: Settings2 },
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
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2.5 py-4">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/camps" || item.path === "/admin" || item.path === "/dashboard"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium",
                        isActive
                          ? "bg-red-700 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
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

function ProfileMenu({ role }: { role: UserRole }) {
  const { logout } = useAuth();
  const { data: me } = useAuthMe();
  const [open, setOpen] = useState(false);
  const name = me?.display_name || me?.username || ROLE_LABELS[role];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border border-slate-300 bg-white px-2 py-1 text-left hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 items-center justify-center bg-slate-800 text-[11px] font-semibold text-white">
          {(name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[160px] truncate text-[12px] font-semibold text-slate-900">{name}</span>
          <span className="block text-[10px] text-slate-500">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-3.5 w-3.5" />
              Profile & settings
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppLayout() {
  const { user } = useAuth();
  const role = user?.role as UserRole;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = pageMetaForPath(pathname);

  return (
    <div className="flex min-h-screen bg-[#f0f2f5] text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-700 px-3 py-3">
          <img src="/logo.svg" alt="RaktDurg" className="h-7 w-7 bg-white/10 p-1" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold">RaktDurg</div>
            <div className="truncate text-[10px] text-slate-400">Blood bank</div>
          </div>
        </div>
        <SidebarNav role={role} />
        <div className="border-t border-slate-700 px-3 py-2 text-[11px] text-slate-400">
          {ROLE_LABELS[role] ?? role}
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/50" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-3 py-3">
              <span className="text-sm font-semibold">RaktDurg</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1.5 text-slate-300 hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-300 bg-white">
          <div className="flex min-h-[56px] items-center justify-between gap-3 px-3 py-2 lg:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="border border-slate-300 p-1.5 text-slate-700 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[16px] font-semibold text-slate-900">{meta.title}</h1>
                {meta.description ? (
                  <p className="truncate text-[12px] text-slate-500">{meta.description}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/profile" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </Link>
              <ProfileMenu role={role} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-3 lg:px-5 lg:py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
