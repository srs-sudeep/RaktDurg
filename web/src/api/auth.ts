import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface AuthMe {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  role: string;
  facility_id: string | null;
  donor_id: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export function useAuthMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data as AuthMe;
    },
  });
}
