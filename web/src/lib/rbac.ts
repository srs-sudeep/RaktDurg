export const USER_ROLES = [
  "superadmin",
  "district_admin",
  "doctor",
  "organizer",
  "citizen",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface JWTPayload {
  sub: string;
  role: UserRole;
  facility_id: string | null;
  exp: number;
  iat: number;
}

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["superadmin", "district_admin", "doctor"],
  "/units": ["superadmin", "district_admin", "doctor"],
  "/donors": ["superadmin", "district_admin", "doctor"],
  "/screenings": ["superadmin", "district_admin", "doctor"],
  "/camps": ["superadmin", "doctor", "organizer", "district_admin"],
  "/camps/approval": ["superadmin", "doctor"],
  "/camps/bookings": ["superadmin", "doctor", "district_admin"],
  "/camps/apply": ["organizer", "superadmin"],
  "/requisitions": ["superadmin", "doctor", "district_admin"],
  "/wallet": ["superadmin", "doctor"],
  "/admin": ["superadmin", "district_admin"],
};

export function canAccess(role: UserRole, path: string): boolean {
  const allowedRoles = ROUTE_ROLES[path];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadmin",
  district_admin: "District Admin",
  doctor: "Doctor",
  organizer: "Organiser",
  citizen: "Citizen",
};
