/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { apiClient } from "@/api/client";
import type { JWTPayload, UserRole } from "@/lib/rbac";

interface AuthUser {
  sub: string;
  role: UserRole;
  facility_id: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ sub: decoded.sub, role: decoded.role, facility_id: decoded.facility_id });
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      } catch {
        localStorage.removeItem("access_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await apiClient.post(
      "/auth/token",
      { username, password },
      { _skipErrorToast: true } as never
    );

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);

    const decoded = jwtDecode<JWTPayload>(data.access_token);
    setUser({ sub: decoded.sub, role: decoded.role, facility_id: decoded.facility_id });
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      try {
        await apiClient.post("/auth/logout", { refresh_token: refresh });
      } catch {
        // Revocation is best-effort
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
