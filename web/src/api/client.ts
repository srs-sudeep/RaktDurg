import axios from "axios";
import { getErrorMessage } from "@/lib/errors";
import { showErrorToast } from "@/lib/toast";

/** Empty string = same-origin (production nginx). Do not fall back to localhost when env is "". */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return /\/auth\/(token|refresh|logout)(\?|$)/.test(url);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
      refresh_token: refresh,
    });
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data.access_token as string;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const onLoginPage =
      typeof window !== "undefined" && window.location.pathname.startsWith("/login");

    // Never treat failed login/refresh/logout as an expired session — that
    // used to hard-reload /login and look like the form "just refreshes".
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (!onLoginPage) {
        showErrorToast("Session expired", "Please sign in again.");
        window.location.href = "/login";
      }
    }
    // Global failure toast for staff/citizen flows. Opt out with `_skipErrorToast`
    // when a screen shows a more specific message (e.g. login).
    if (!error.config?._skipErrorToast && !isAuthEndpoint(error.config?.url)) {
      showErrorToast("Request failed", getErrorMessage(error));
    }
    return Promise.reject(error);
  }
);
