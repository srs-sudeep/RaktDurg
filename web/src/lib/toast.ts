export type ToastVariant = "info" | "success" | "error";

export interface ToastPayload {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastListener = (toast: Required<ToastPayload>) => void;

const listeners = new Set<ToastListener>();
const recentKeys = new Map<string, number>();
const DEDUPE_MS = 2500;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeToToasts(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(payload: ToastPayload) {
  const key = `${payload.variant ?? "info"}:${payload.title}:${payload.description ?? ""}`;
  const now = Date.now();
  const last = recentKeys.get(key);
  if (last && now - last < DEDUPE_MS) return;
  recentKeys.set(key, now);

  const toast: Required<ToastPayload> = {
    id: payload.id ?? createId(),
    title: payload.title,
    description: payload.description ?? "",
    variant: payload.variant ?? "info",
  };

  listeners.forEach((listener) => listener(toast));
}

export function showErrorToast(title: string, description?: string) {
  showToast({ title, description, variant: "error" });
}

export function showSuccessToast(title: string, description?: string) {
  showToast({ title, description, variant: "success" });
}

export function showInfoToast(title: string, description?: string) {
  showToast({ title, description, variant: "info" });
}
