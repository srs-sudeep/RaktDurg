import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface StockEntry {
  blood_group: string;
  component_type: string;
  available_count: number;
  earliest_expiry: string | null;
}

export interface StockResponse {
  facility_id: string;
  entries: StockEntry[];
  as_of: string;
}

export const stockKeys = {
  all: ["stock"] as const,
  facility: (id: string) => ["stock", id] as const,
  public: (id: string) => ["stock", "public", id] as const,
};

export function useAuthenticatedStock(facilityId: string) {
  return useQuery({
    queryKey: stockKeys.facility(facilityId),
    queryFn: async (): Promise<StockResponse> => {
      const { data } = await apiClient.get(`/stock/${facilityId}`);
      return data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function usePublicStock(facilityId: string) {
  return useQuery({
    queryKey: stockKeys.public(facilityId),
    queryFn: async (): Promise<StockResponse> => {
      const { data } = await apiClient.get(`/public/stock/${facilityId}`);
      return data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
