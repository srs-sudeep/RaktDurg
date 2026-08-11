export const USER_ROLES = [
  "admin",
  "medical_officer",
  "lab_tech",
  "phlebotomist",
  "inventory_officer",
  "organizer",
  "donor",
  "citizen_read",
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
  "/dashboard": ["admin", "medical_officer", "lab_tech", "inventory_officer", "phlebotomist"],
  "/units": ["admin", "medical_officer", "lab_tech", "inventory_officer", "phlebotomist"],
  "/donors": ["admin", "medical_officer", "lab_tech", "phlebotomist"],
  "/screenings": ["admin", "medical_officer", "lab_tech", "phlebotomist"],
  "/camps": ["admin", "medical_officer", "organizer", "inventory_officer"],
  "/camps/approval": ["admin", "medical_officer"],
  "/camps/apply": ["organizer", "admin"],
  "/requisitions": ["admin", "medical_officer", "inventory_officer"],
  "/wallet": ["admin", "medical_officer", "donor"],
  "/admin": ["admin"],
};

export function canAccess(role: UserRole, path: string): boolean {
  const allowedRoles = ROUTE_ROLES[path];
  if (!allowedRoles) return true;
  return allowedRoles.includes(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  medical_officer: "Medical Officer",
  lab_tech: "Lab Technician",
  phlebotomist: "Phlebotomist",
  inventory_officer: "Inventory Officer",
  organizer: "Camp Organizer",
  donor: "Donor",
  citizen_read: "Public Viewer",
};
