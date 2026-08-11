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

/** Role gates for staff routes. Superadmin is included on every staff path. */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["superadmin", "district_admin", "doctor", "organizer"],
  "/profile": ["superadmin", "district_admin", "doctor", "organizer"],
  "/units": ["superadmin", "district_admin", "doctor"],
  "/donors": ["superadmin", "district_admin", "doctor"],
  "/camps": ["superadmin", "doctor", "organizer", "district_admin"],
  "/camps/approval": ["superadmin", "doctor"],
  "/camps/bookings": ["superadmin", "doctor", "district_admin"],
  "/camps/apply": ["organizer", "superadmin"],
  "/requisitions": ["superadmin", "doctor", "district_admin"],
  "/wallet": ["superadmin", "doctor", "district_admin"],
  "/organizers": ["superadmin", "district_admin", "doctor"],
  "/organizer-directory": ["superadmin", "district_admin", "doctor"],
  "/citizens/link": ["superadmin", "district_admin", "doctor"],
  "/users": ["superadmin"],
  "/admin": ["superadmin"],
};

export function canAccess(role: UserRole, path: string): boolean {
  if (role === "superadmin") return true;
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
