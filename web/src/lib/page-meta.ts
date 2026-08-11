export type PageMeta = {
  title: string;
  description?: string;
};

const PAGE_META: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Role overview and live operations",
  },
  "/profile": {
    title: "Profile",
    description: "Account details and session",
  },
  "/units": { title: "Blood units", description: "Inventory barcodes and lifecycle" },
  "/donors": { title: "Donors", description: "Registration and screening" },
  "/camps": { title: "Camps", description: "Applications and schedules" },
  "/camps/approval": { title: "Camp approvals", description: "Pending review queue" },
  "/camps/bookings": { title: "Camp bookings", description: "Citizen slot requests" },
  "/camps/apply": { title: "Apply for camp", description: "Submit a new camp application" },
  "/requisitions": { title: "Requisitions", description: "Patient blood requests" },
  "/wallet": { title: "Wallet", description: "Blood credit balances" },
  "/organizers": { title: "Organizer accounts", description: "Login-linked organizers" },
  "/organizer-directory": { title: "Outreach directory", description: "Red Cross contact list" },
  "/citizens/link": { title: "Link citizen", description: "Connect citizen login to a donor profile" },
  "/users": { title: "Users & roles", description: "Staff account administration" },
  "/admin": { title: "System", description: "Feature flags and e-RaktKosh export" },
};

export function pageMetaForPath(pathname: string): PageMeta {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const key = Object.keys(PAGE_META)
    .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
  return key ? PAGE_META[key] : { title: "RaktDurg ERP", description: "Blood bank operations" };
}
