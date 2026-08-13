import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BrandingFooter } from "@/components/Branding";
import { LoginHeroPanel } from "@/components/DecorativeGraphics";
import { PartnerLogos } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form";
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
    } catch (err) {
      const message = getErrorMessage(err, "Invalid username or password");
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

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-10">
        <div className="mb-5 flex flex-col items-center lg:hidden">
          <img src="/logo.svg" alt="RaktDurg" className="h-12 w-12" />
          <h1 className="mt-2 font-display text-xl font-semibold text-foreground">RaktDurg</h1>
          <p className="text-[13px] text-muted-foreground">Sign in</p>
        </div>

        <div className="surface-card w-full max-w-sm p-5">
          <div className="mb-4 hidden border-b border-border pb-3 lg:block">
            <h2 className="font-display text-lg font-semibold text-foreground">Sign in</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Staff operations and citizen account access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <FormField label="Username" htmlFor="username" required>
              <FormInput
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
                autoComplete="username"
              />
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <FormInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                autoComplete="current-password"
              />
            </FormField>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[12px] text-muted-foreground">
            <Link to="/" className="font-medium text-primary hover:underline">
              ← Home
            </Link>
            <Link to="/public/stock" className="font-medium text-primary hover:underline">
              Public stock
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <PartnerLogos size="sm" />
          <BrandingFooter className="text-center" />
        </div>
      </div>
    </div>
  );
}
