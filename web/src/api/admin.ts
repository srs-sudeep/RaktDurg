import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export function useWallet(donorId: string) {
  return useQuery({
    queryKey: ["wallet", donorId],
    enabled: !!donorId,
    queryFn: async () => {
      const { data } = await apiClient.get(`/wallet/donors/${donorId}`);
      return data as { balance: number; donor_id: string };
    },
    retry: false,
  });
}

export function useFeatureFlags(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "flags"],
    enabled: options?.enabled !== false,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/feature-flags");
      return data as { name: string; is_enabled: boolean; description: string | null }[];
    },
  });
}

export function useToggleFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, is_enabled }: { name: string; is_enabled: boolean }) => {
      const { data } = await apiClient.patch(`/admin/feature-flags/${name}`, null, {
        params: { is_enabled },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "flags"] }),
  });
}

export function useErakkoshExport() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/admin/erakkosh/export");
      return data as { submission_id: string; export_date: string };
    },
  });
}

export function useLinkCitizen() {
  return useMutation({
    mutationFn: async (body: { username: string; donor_id: string }) => {
      const { data } = await apiClient.post("/admin/citizens/link", body);
      return data as {
        user_id: string;
        username: string;
        donor_id: string;
        donor_name: string;
      };
    },
  });
}
