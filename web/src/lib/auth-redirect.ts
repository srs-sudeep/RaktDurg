export function defaultRouteForRole(role: string): string {
  if (role === "donor") return "/wallet";
  if (role === "citizen_read") return "/public/stock";
  return "/dashboard";
}
