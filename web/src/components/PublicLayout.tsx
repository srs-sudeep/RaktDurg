import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { BrandingFooter } from "@/components/Branding";
import { useAuth } from "@/context/AuthContext";
import { defaultRouteForRole } from "@/lib/auth-redirect";

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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="RaktDurg" className="h-9 w-9" />
            <span className="text-lg font-bold text-gray-900">RaktDurg</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? "bg-red-50 text-red-700" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <>
                {isCitizen ? (
                  <>
                    <Link
                      to="/my-account"
                      className="ml-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                      My Account
                    </Link>
                    <Link
                      to="/my-account/wallet"
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                      Wallet
                    </Link>
                  </>
                ) : (
                  <Link
                    to={staffHome}
                    className="ml-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="ml-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700"
              >
                Sign in
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-gray-100 bg-white px-4 py-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? "bg-red-50 text-red-700" : "text-gray-700 hover:bg-gray-50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  {isCitizen ? (
                    <>
                      <Link
                        to="/my-account"
                        onClick={() => setMobileOpen(false)}
                        className="mt-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        My Account
                      </Link>
                      <Link
                        to="/my-account/wallet"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Wallet
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={staffHome}
                      onClick={() => setMobileOpen(false)}
                      className="mt-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                    className="mt-2 rounded-lg bg-red-600 px-3 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 rounded-lg bg-red-600 px-3 py-2.5 text-center text-sm font-medium text-white"
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

      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4">
          <PartnerLogos size="sm" />
          <BrandingFooter showAboutLink={false} />
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} RaktDurg — Durg District Blood Bank Platform
          </p>
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
