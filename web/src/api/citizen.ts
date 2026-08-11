import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface CitizenProfile {
  donor_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  name: string;
  date_of_birth: string | null;
  age_years: number | null;
  sex: string | null;
  contact_phone: string;
  address: string | null;
  blood_group: string | null;
  status: string;
  abha_reference: string | null;
  abha_verified: boolean;
  consent_given: boolean;
  registered_at_facility_id: string | null;
}

export interface CitizenWalletTxn {
  id: string;
  wallet_id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  beneficiary_donor_id: string | null;
  expiry_date: string | null;
  recorded_at: string;
}

export interface CitizenWallet {
  wallet: {
    id: string;
    donor_id: string;
    balance: number;
    is_active: boolean;
  };
  transactions: CitizenWalletTxn[];
}

export interface CitizenDonation {
  donation_id: string;
  camp_id: string | null;
  camp_name: string | null;
  location: string | null;
  collection_datetime: string;
  donation_type: string;
  volume_ml: number | null;
}

export interface PublicCamp {
  id: string;
  camp_name: string;
  requested_date: string;
  location: string;
  expected_donors: number | null;
  host_facility_id: string;
  host_facility_name: string | null;
}

export interface CitizenBooking {
  id: string;
  camp_id: string;
  camp_name: string;
  requested_date: string;
  location: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const citizenKeys = {
  profile: ["citizen", "profile"] as const,
  wallet: ["citizen", "wallet"] as const,
  donations: ["citizen", "donations"] as const,
  bookings: ["citizen", "bookings"] as const,
  camps: ["citizen", "public-camps"] as const,
};

export function useCitizenProfile() {
  return useQuery({
    queryKey: citizenKeys.profile,
    queryFn: async () => {
      const { data } = await apiClient.get("/citizen/profile");
      return data as CitizenProfile;
    },
  });
}

export function useCitizenWallet() {
  return useQuery({
    queryKey: citizenKeys.wallet,
    queryFn: async () => {
      const { data } = await apiClient.get("/citizen/wallet");
      return data as CitizenWallet;
    },
  });
}

export function useCitizenDonations() {
  return useQuery({
    queryKey: citizenKeys.donations,
    queryFn: async () => {
      const { data } = await apiClient.get("/citizen/donations");
      return data as CitizenDonation[];
    },
  });
}

export function useCitizenBookings() {
  return useQuery({
    queryKey: citizenKeys.bookings,
    queryFn: async () => {
      const { data } = await apiClient.get("/citizen/bookings");
      return data as CitizenBooking[];
    },
  });
}

export function useCitizenStock() {
  return useQuery({
    queryKey: [...citizenKeys.profile, "stock"] as const,
    queryFn: async () => {
      const { data } = await apiClient.get("/citizen/stock");
      return data as {
        facility_id: string;
        facility_name: string | null;
        entries: Array<{
          blood_group: string;
          component_type: string;
          available_count: number;
        }>;
        as_of: string;
      };
    },
  });
}

export function usePublicDefaultFacility() {
  return useQuery({
    queryKey: ["public", "default-facility"] as const,
    queryFn: async () => {
      const { data } = await apiClient.get("/public/facilities/default");
      return data as { id: string; name: string; facility_code: string; district: string | null };
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function usePublicCamps() {
  return useQuery({
    queryKey: citizenKeys.camps,
    queryFn: async () => {
      const { data } = await apiClient.get("/public/camps");
      return data as PublicCamp[];
    },
  });
}

export function useCreateCitizenBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campId, notes }: { campId: string; notes?: string }) => {
      const { data } = await apiClient.post("/citizen/bookings", {
        camp_id: campId,
        notes,
      });
      return data as CitizenBooking;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: citizenKeys.bookings });
      void qc.invalidateQueries({ queryKey: citizenKeys.camps });
    },
  });
}

export function useCancelCitizenBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await apiClient.post(`/citizen/bookings/${bookingId}/cancel`);
      return data as CitizenBooking;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: citizenKeys.bookings });
      void qc.invalidateQueries({ queryKey: citizenKeys.camps });
    },
  });
}
