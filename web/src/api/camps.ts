import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface Camp {
  id: string;
  organizer_id: string;
  host_facility_id: string;
  camp_name: string;
  requested_date: string;
  location: string;
  expected_donors: number;
  status: string;
  coupon_prefix: string | null;
  approved_by: string | null;
  approval_datetime: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export function useCamps(status?: string) {
  return useQuery({
    queryKey: ["camps", status],
    queryFn: async () => {
      const { data } = await apiClient.get("/camps", {
        params: { page_size: 50, camp_status: status || undefined },
      });
      return data as { items: Camp[]; total: number };
    },
  });
}

export function useApplyCamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await apiClient.post("/camps", body);
      return data as Camp;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["camps"] }),
  });
}

export function useReviewCamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, coupon_prefix, rejection_reason }: {
      id: string; action: "approve" | "reject"; coupon_prefix?: string; rejection_reason?: string;
    }) => {
      const { data } = await apiClient.post(`/camps/${id}/review`, {
        action, coupon_prefix, rejection_reason,
      });
      return data as Camp;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["camps"] }),
  });
}

export function useCampCoupons(campId: string) {
  return useQuery({
    queryKey: ["camps", campId, "coupons"],
    enabled: !!campId,
    queryFn: async () => {
      const { data } = await apiClient.get(`/camps/${campId}/coupons`);
      return data as { id: string; coupon_code: string; is_used: boolean }[];
    },
  });
}

export interface CampBooking {
  id: string;
  camp_id: string;
  camp_name: string;
  requested_date: string;
  location: string;
  donor_id: string;
  donor_name: string;
  donor_phone: string;
  blood_group: string | null;
  status: string;
  notes: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useCampBookings(status?: string) {
  return useQuery({
    queryKey: ["camps", "bookings", status],
    queryFn: async () => {
      const { data } = await apiClient.get("/camps/bookings/list", {
        params: { status: status || undefined },
      });
      return data as CampBooking[];
    },
  });
}

export function useReviewCampBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      review_notes,
    }: {
      id: string;
      action: "confirm" | "reject";
      review_notes?: string;
    }) => {
      const { data } = await apiClient.post(`/camps/bookings/${id}/review`, {
        action,
        review_notes,
      });
      return data as CampBooking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["camps", "bookings"] }),
  });
}
