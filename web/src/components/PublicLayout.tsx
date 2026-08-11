import { Link, NavLink, Outlet } from "react-router-dom";
import { BrandingFooter } from "@/components/Branding";

const NAV = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/public/stock", label: "Blood Stock" },
];

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="RaktDurg" className="h-9 w-9" />
            <span className="text-lg font-semibold text-gray-900">RaktDurg</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium ${
                    isActive ? "bg-red-50 text-red-700" : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="ml-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Staff Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-8">
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
