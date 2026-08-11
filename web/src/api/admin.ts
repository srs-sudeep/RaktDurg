import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  role: string;
  facility_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface OrganizerAccount {
  id: string;
  user_id: string;
  org_name: string;
  org_type: string | null;
  org_category: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizerDirectoryItem {
  id: string;
  category: string;
  org_name: string;
  contact_role: string | null;
  location: string | null;
  mobile: string | null;
  source_serial: number | null;
  created_at: string;
}

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

export function useAdminUsers(params?: { page?: number; role?: string; q?: string }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/users", {
        params: {
          page: params?.page ?? 1,
          page_size: 50,
          role: params?.role || undefined,
          q: params?.q || undefined,
        },
      });
      return data as { items: AdminUser[]; total: number; page: number; page_size: number };
    },
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      role?: string;
      is_active?: boolean;
      display_name?: string | null;
    }) => {
      const { data } = await apiClient.patch(`/admin/users/${id}`, body);
      return data as AdminUser;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useOrganizerAccounts() {
  return useQuery({
    queryKey: ["admin", "organizers"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/organizers", {
        params: { page_size: 200 },
      });
      return data as { items: OrganizerAccount[]; total: number };
    },
  });
}

export function useOrganizerDirectory(params?: { category?: string; q?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "organizer-directory", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/organizer-directory", {
        params: {
          page: params?.page ?? 1,
          page_size: 100,
          category: params?.category || undefined,
          q: params?.q || undefined,
        },
      });
      return data as { items: OrganizerDirectoryItem[]; total: number };
    },
  });
}
