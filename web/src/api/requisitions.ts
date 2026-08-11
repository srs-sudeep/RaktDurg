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

export type RequisitionListParams = {
  facility_id?: string | null;
  page?: number;
  page_size?: number;
  q?: string;
  status?: string;
  blood_group?: string;
  priority?: string;
  order_by?: string;
  order?: string;
};

export function useRequisitions(params: RequisitionListParams | string | null | undefined = {}) {
  const normalized: RequisitionListParams =
    typeof params === "string" || params == null
      ? { facility_id: params }
      : params;
  const query = {
    facility_id: normalized.facility_id || undefined,
    page: normalized.page ?? 1,
    page_size: normalized.page_size ?? 50,
    q: normalized.q,
    status: normalized.status,
    blood_group: normalized.blood_group,
    priority: normalized.priority,
    order_by: normalized.order_by,
    order: normalized.order,
  };
  return useQuery({
    queryKey: ["requisitions", query],
    queryFn: async () => {
      const { data } = await apiClient.get("/requisitions", { params: query });
      return data as { items: Requisition[]; total: number; page: number; page_size: number };
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
