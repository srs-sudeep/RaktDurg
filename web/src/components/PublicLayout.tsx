import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { BrandingFooter } from "@/components/Branding";
import { useAuth } from "@/context/AuthContext";
import { defaultRouteForRole } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/public/camps", label: "Camps" },
  { path: "/public/stock", label: "Blood Stock" },
];

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const isCitizen = user?.role === "citizen";
  const staffHome = user ? defaultRouteForRole(user.role) : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="RaktDurg" className="h-9 w-9" />
            <span className="font-display text-lg font-semibold text-foreground">RaktDurg</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="ml-3 flex items-center gap-2 border-l border-border pl-4">
              {user ? (
                <>
                  {isCitizen ? (
                    <Link
                      to="/my-account"
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      My Account
                    </Link>
                  ) : (
                    <Link
                      to={staffHome}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted sm:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border bg-card px-4 py-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  {isCitizen ? (
                    <Link
                      to="/my-account"
                      onClick={() => setMobileOpen(false)}
                      className="mt-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      My Account
                    </Link>
                  ) : (
                    <Link
                      to={staffHome}
                      onClick={() => setMobileOpen(false)}
                      className="mt-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void logout();
                    }}
                    className="mt-2 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
          <div>
            <p className="font-display text-base font-semibold text-foreground">RaktDurg</p>
            <p className="mt-2 text-sm text-muted-foreground">
              District blood bank operations for Durg — stock, camps, and donor workflows.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="text-foreground hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start gap-4 sm:items-end">
            <PartnerLogos size="sm" />
            <BrandingFooter showAboutLink={false} className="sm:text-right" />
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} RaktDurg
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface PartnerLogosProps {
  size?: "sm" | "md" | "lg";
}

export function PartnerLogos({ size = "md" }: PartnerLogosProps) {
  const iitH = size === "sm" ? "h-10" : size === "lg" ? "h-20" : "h-14";
  const ibitfH = size === "sm" ? "h-8" : size === "lg" ? "h-16" : "h-12";
  const recogxH = size === "sm" ? "h-6" : size === "lg" ? "h-12" : "h-8";

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
      <img src="/IIT_Bhilai.svg" alt="IIT Bhilai" className={`${iitH} object-contain opacity-90`} />
      <img src="/IBITF.jpeg" alt="IBITF" className={`${ibitfH} rounded object-contain`} />
      <img src="/recogx.webp" alt="Recogx Init" className={`${recogxH} object-contain`} />
    </div>
  );
}
