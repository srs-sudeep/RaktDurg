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
      { path: "/organizers", label: "Organizers", icon: Building2 },
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

function SidebarBrand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-3 px-1 py-0.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <img src="/logo.svg" alt="" className="h-6 w-6" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[15px] font-semibold tracking-tight text-white">
          RaktDurg
        </span>
        <span className="block truncate text-[11px] text-slate-400">Durg blood bank</span>
      </span>
    </Link>
  );
}

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
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {section.label}
          </p>
          <ul className="space-y-1">
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
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                        isActive
                          ? "bg-[#b91c1c] text-white shadow-sm shadow-red-950/40"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
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

function SidebarAccount({ role }: { role: UserRole }) {
  const { logout } = useAuth();
  const { data: me } = useAuthMe();
  const name = me?.display_name || me?.username || ROLE_LABELS[role];

  return (
    <div className="border-t border-white/10 p-3">
      <div className="rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#b91c1c] text-[13px] font-semibold text-white">
            {(name || "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">{name}</div>
            <div className="truncate text-[11px] text-slate-400">{ROLE_LABELS[role]}</div>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/5 px-2 py-1.5 text-[11px] font-medium text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            <UserRound className="h-3 w-3" />
            Profile
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/5 px-2 py-1.5 text-[11px] font-medium text-slate-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function TopProfileMenu({ role }: { role: UserRole }) {
  const { logout } = useAuth();
  const { data: me } = useAuthMe();
  const [open, setOpen] = useState(false);
  const name = me?.display_name || me?.username || ROLE_LABELS[role];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-slate-100/80 py-1 pl-1 pr-2.5 text-left transition-colors hover:bg-slate-200/80"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[12px] font-semibold text-white">
          {(name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[140px] truncate text-[13px] font-semibold leading-tight text-slate-900">
            {name}
          </span>
          <span className="block text-[11px] leading-tight text-slate-500">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
          >
            <div className="border-b border-slate-100 px-3 py-2.5">
              <div className="truncate text-[13px] font-semibold text-slate-900">{name}</div>
              <div className="truncate text-[11px] text-slate-500">{ROLE_LABELS[role]}</div>
            </div>
            <Link
              to="/profile"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-3.5 w-3.5 text-slate-400" />
              Profile & settings
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SidebarShell({
  role,
  className,
  onNavigate,
  onClose,
}: {
  role: UserRole;
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <aside className={cn("flex h-full flex-col bg-[#111827] text-white", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
        <SidebarBrand />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <SidebarNav role={role} onNavigate={onNavigate} />
      <SidebarAccount role={role} />
    </aside>
  );
}

export function AppLayout() {
  const { user } = useAuth();
  const role = user?.role as UserRole;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = pageMetaForPath(pathname);

  return (
    <div className="flex min-h-screen bg-[#eef1f4] text-slate-900">
      <div className="sticky top-0 hidden h-screen w-[252px] shrink-0 lg:block">
        <SidebarShell role={role} className="h-screen border-r border-slate-900/40" />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[252px] shadow-2xl shadow-slate-950/40">
            <SidebarShell
              role={role}
              className="h-full"
              onNavigate={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-[#eef1f4]/90 backdrop-blur-md">
          <div className="flex min-h-[60px] items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[18px] font-semibold tracking-tight text-slate-900">
                  {meta.title}
                </h1>
                {meta.description ? (
                  <p className="truncate text-[12px] text-slate-500">{meta.description}</p>
                ) : null}
              </div>
            </div>
            <TopProfileMenu role={role} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 lg:px-6 lg:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
