import axios from "axios";

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === "string") return first;
      if (first && typeof first.msg === "string") return first.msg;
    }
    if (typeof error.message === "string" && error.message.trim()) return error.message;
  }

  if (error instanceof Error && error.message.trim()) return error.message;

  return fallback;
}
