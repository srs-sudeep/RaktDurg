export function defaultRouteForRole(role: string): string {
  if (role === "citizen") return "/my-account";
  return "/dashboard";
}
