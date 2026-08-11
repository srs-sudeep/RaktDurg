import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface BloodUnit {
  id: string;
  barcode: string;
  donation_id: string;
  blood_group: string;
  facility_id: string;
  collection_datetime: string;
  expiry_datetime: string;
  release_status: string;
  lifecycle_state: string;
  discarded_reason: string | null;
  created_at: string;
}

export function useUnits(facilityId?: string | null) {
  return useQuery({
    queryKey: ["units", facilityId],
    queryFn: async () => {
      const { data } = await apiClient.get("/units", {
        params: { facility_id: facilityId || undefined, page_size: 50 },
      });
      return data as { items: BloodUnit[]; total: number };
    },
  });
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: ["units", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await apiClient.get(`/units/${id}`);
      return data as BloodUnit;
    },
  });
}

export function useScanBarcode() {
  return useMutation({
    mutationFn: async (barcode: string) => {
      const { data } = await apiClient.get(`/units/scan/${encodeURIComponent(barcode)}`);
      return data;
    },
  });
}

export function useTransitionUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, target_state, reason }: { id: string; target_state: string; reason?: string }) => {
      const { data } = await apiClient.patch(`/units/${id}/state`, { target_state, reason });
      return data as BloodUnit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useRecordTests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, results }: { id: string; results: { test_panel: string; result: string }[] }) => {
      const { data } = await apiClient.post(`/units/${id}/tests`, { results });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}
