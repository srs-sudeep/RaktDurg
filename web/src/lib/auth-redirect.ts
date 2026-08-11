export function defaultRouteForRole(role: string): string {
  if (role === "citizen") return "/public/stock";
  if (role === "organizer") return "/camps/apply";
  return "/dashboard";
}
