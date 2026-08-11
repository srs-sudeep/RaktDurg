import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface Donor {
  id: string;
  name: string;
  date_of_birth: string;
  age_years: number | null;
  sex: string;
  contact_phone: string;
  blood_group: string;
  status: string;
  abha_reference: string | null;
  abha_verified: boolean;
  consent_given: boolean;
  registered_at_facility_id: string;
  created_at: string;
}

export type DonorListParams = {
  page?: number;
  page_size?: number;
  q?: string;
  blood_group?: string;
  status?: string;
  order_by?: string;
  order?: string;
};

export function useDonors(params: DonorListParams = {}) {
  const query = {
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
    q: params.q,
    blood_group: params.blood_group,
    status: params.status,
    order_by: params.order_by,
    order: params.order,
  };
  return useQuery({
    queryKey: ["donors", query],
    queryFn: async () => {
      const { data } = await apiClient.get("/donors", { params: query });
      return data as { items: Donor[]; total: number; page: number; page_size: number };
    },
  });
}

export function useDonor(id: string) {
  return useQuery({
    queryKey: ["donors", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/donors/${id}`);
      return data as Donor;
    },
  });
}

export function useCreateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await apiClient.post("/donors", body);
      return data as Donor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useCreateScreening(donorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await apiClient.post(`/donors/${donorId}/screenings`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors", donorId] }),
  });
}
