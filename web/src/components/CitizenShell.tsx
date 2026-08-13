import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/my-account", label: "Overview" },
  { to: "/my-account/profile", label: "Profile" },
  { to: "/my-account/wallet", label: "Wallet" },
  { to: "/my-account/history", label: "History" },
  { to: "/my-account/bookings", label: "Bookings" },
];

export function CitizenShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "citizen") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="surface-card">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-card px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">Citizen portal</span>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Link to="/public/camps" className="text-sm font-medium text-primary hover:underline">
            Browse camps →
          </Link>
        </div>

        <div className="border-b border-border bg-card px-4 sm:px-8">
          <nav className="-mb-px flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "border-b-2 px-3 py-3 text-sm font-medium transition",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-6 py-6 sm:px-8">{children ?? <Outlet />}</div>
      </div>
    </div>
  );
}
