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
    "A+": "bg-red-100 text-red-800",
    "A-": "bg-red-50 text-red-700",
    "B+": "bg-blue-100 text-blue-800",
    "B-": "bg-blue-50 text-blue-700",
    "AB+": "bg-purple-100 text-purple-800",
    "AB-": "bg-purple-50 text-purple-700",
    "O+": "bg-green-100 text-green-800",
    "O-": "bg-green-50 text-green-700",
  };
  return colors[bg] ?? "bg-gray-100 text-gray-800";
}
