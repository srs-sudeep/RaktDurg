import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bloodGroupColor(bg: string): string {
  const colors: Record<string, string> = {
    "A+": "bg-primary/15 text-primary",
    "A-": "bg-primary/10 text-primary",
    "B+": "bg-muted text-foreground",
    "B-": "bg-muted text-muted-foreground",
    "AB+": "bg-secondary text-foreground",
    "AB-": "bg-secondary text-muted-foreground",
    "O+": "bg-success/15 text-success",
    "O-": "bg-success/10 text-success",
  };
  return colors[bg] ?? "bg-muted text-foreground";
}
