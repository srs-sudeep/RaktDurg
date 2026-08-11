import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BrandingFooter } from "@/components/Branding";
import { LoginHeroPanel } from "@/components/DecorativeGraphics";
import { PartnerLogos } from "@/components/PublicLayout";
import { defaultRouteForRole } from "@/lib/auth-redirect";
import { getErrorMessage } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";
import { jwtDecode } from "jwt-decode";
import type { JWTPayload } from "@/lib/rbac";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      const token = localStorage.getItem("access_token");
      const role = token ? jwtDecode<JWTPayload>(token).role : "superadmin";
      navigate(defaultRouteForRole(role));
    } catch (error) {
      const message = getErrorMessage(error, "Invalid username or password");
      setError(message);
      showErrorToast("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block lg:w-[52%]">
        <LoginHeroPanel />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-10">
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <img src="/logo.svg" alt="RaktDurg" className="h-16 w-16" />
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Sign in to RaktDurg</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg shadow-gray-200/60">
            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-500">
                One sign-in for citizens and staff. Citizens use stock and wallet; staff use operations tools.
              </p>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Citizen sign in</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Blood stock, wallet access, and future donor-facing features.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Staff sign in</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Inventory, donors, camps, requisitions, and district workflows.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-600/25 transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <Link to="/" className="font-medium text-red-600 hover:text-red-700 hover:underline">
                ← Back to home
              </Link>
              <Link to="/public/stock" className="font-medium text-red-600 hover:text-red-700 hover:underline">
                Check blood stock
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <PartnerLogos size="sm" />
            <BrandingFooter className="text-center" />
          </div>
        </div>
      </div>
    </div>
  );
}
