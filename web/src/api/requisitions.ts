import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface Requisition {
  id: string;
  facility_id: string;
  patient_name: string;
  patient_hospital_id: string;
  blood_group: string;
  component_type: string;
  units_requested: number;
  priority: string;
  status: string;
  clinical_indication: string;
  requested_by: string;
  requested_at: string;
  fulfilled_at: string | null;
}

export function useRequisitions(facilityId?: string | null) {
  return useQuery({
    queryKey: ["requisitions", facilityId],
    queryFn: async () => {
      const { data } = await apiClient.get("/requisitions", {
        params: { facility_id: facilityId || undefined, page_size: 50 },
      });
      return data as { items: Requisition[]; total: number };
    },
  });
}

export function useCreateRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await apiClient.post("/requisitions", body);
      return data as Requisition;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requisitions"] }),
  });
}

export function useReserveRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/requisitions/${id}/reserve`);
      return data as Requisition;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requisitions"] }),
  });
}

export function useIssueRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/requisitions/${id}/issue`);
      return data as Requisition;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requisitions"] }),
  });
}

export function useCancelRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/requisitions/${id}/cancel`);
      return data as Requisition;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requisitions"] }),
  });
}
