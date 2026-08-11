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
  venue_mode?: string;
  alternate_dates?: string[] | null;
  special_date_note?: string | null;
  camps_per_year?: number | null;
  notes?: string | null;
  status: string;
  coupon_prefix: string | null;
  approved_by: string | null;
  approval_datetime: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export type CampListParams = {
  camp_status?: string;
  page?: number;
  page_size?: number;
  q?: string;
  order_by?: string;
  order?: string;
};

export function useCamps(params?: CampListParams | string) {
  const normalized: CampListParams =
    typeof params === "string" ? { camp_status: params } : params ?? {};
  const query = {
    page: normalized.page ?? 1,
    // API Query(le=100) — clamp so oversized page_size never 422s the list.
    page_size: Math.min(normalized.page_size ?? 50, 100),
    camp_status: normalized.camp_status || undefined,
    q: normalized.q,
    order_by: normalized.order_by,
    order: normalized.order,
  };
  return useQuery({
    queryKey: ["camps", query],
    queryFn: async () => {
      const { data } = await apiClient.get("/camps", { params: query });
      return data as { items: Camp[]; total: number; page: number; page_size: number };
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

export interface CampCoupon {
  id: string;
  coupon_code: string;
  is_used: boolean;
}

export function useCampCoupons(campId: string) {
  return useQuery({
    queryKey: ["camps", campId, "coupons"],
    enabled: !!campId,
    queryFn: async () => {
      const { data } = await apiClient.get(`/camps/${campId}/coupons`);
      return data as CampCoupon[];
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

export type CampBookingListParams = {
  status?: string;
  q?: string;
  order_by?: string;
  order?: string;
};

export function useCampBookings(params?: CampBookingListParams | string) {
  const normalized: CampBookingListParams =
    typeof params === "string" ? { status: params } : params ?? {};
  const query = {
    status: normalized.status || undefined,
    q: normalized.q,
    order_by: normalized.order_by,
    order: normalized.order,
  };
  return useQuery({
    queryKey: ["camps", "bookings", query],
    queryFn: async () => {
      const { data } = await apiClient.get("/camps/bookings/list", { params: query });
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
