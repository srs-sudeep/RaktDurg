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
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
                        isActive
                          ? "bg-red-600 text-white shadow-md shadow-red-950/30"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
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
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-slate-800 to-slate-950 text-[12px] font-semibold text-white">
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
    <div className="flex min-h-screen text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-slate-950/50 bg-gradient-to-b from-[#0b1220] via-[#0f172a] to-[#111827] text-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-3.5 py-4">
          <img src="/logo.svg" alt="RaktDurg" className="h-9 w-9 rounded-lg bg-white/10 p-1.5 ring-1 ring-white/15" />
          <div className="min-w-0 leading-tight">
            <div className="font-display truncate text-[14px] font-bold tracking-tight">RaktDurg</div>
            <div className="truncate text-[10px] text-slate-400">District blood bank</div>
          </div>
        </div>
        <SidebarNav role={role} />
        <div className="border-t border-white/10 px-3 py-3">
          <div className="rounded-lg bg-white/5 px-2.5 py-2 ring-1 ring-white/10">
            <div className="truncate text-[10px] uppercase tracking-[0.12em] text-slate-500">Signed in</div>
            <div className="truncate text-[12px] font-medium text-slate-200">{ROLE_LABELS[role] ?? role}</div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-gradient-to-b from-[#0b1220] to-[#111827] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-3.5">
              <span className="font-display text-sm font-semibold">RaktDurg</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 text-slate-300 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-700 via-red-500 to-rose-400" />
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-3 py-3 lg:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                className="mt-0.5 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 shadow-sm lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  RaktDurg · {ROLE_LABELS[role] ?? role}
                </div>
                <h1 className="font-display truncate text-[20px] font-bold tracking-tight text-slate-900">
                  {meta.title}
                </h1>
                {meta.description ? (
                  <p className="truncate text-[12.5px] text-slate-500">{meta.description}</p>
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

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
