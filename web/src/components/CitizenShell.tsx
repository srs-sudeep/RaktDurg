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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-white shadow-sm">
        <div className="border-b border-red-100 px-6 py-8 sm:px-8">
          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
            Citizen portal
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">{subtitle}</p>
        </div>

        <div className="border-b border-gray-100 bg-white/80 px-4 py-3 sm:px-8">
          <div className="flex flex-wrap gap-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  location.pathname === item.to
                    ? "bg-red-600 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/public/camps"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                location.pathname === "/public/camps"
                  ? "bg-red-600 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              Camps
            </Link>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8">{children ?? <Outlet />}</div>
      </div>
    </div>
  );
}
