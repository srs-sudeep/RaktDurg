export function defaultRouteForRole(role: string): string {
  if (role === "citizen") return "/my-account";
  if (role === "organizer") return "/camps/apply";
  return "/dashboard";
}
