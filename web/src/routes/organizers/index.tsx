import { useMemo } from "react";
import { useOrganizerAccounts, type OrganizerAccount } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export default function OrganizersPage() {
  const { data, isLoading } = useOrganizerAccounts();

  const columns = useMemo<DataTableColumn<OrganizerAccount>[]>(
    () => [
      {
        id: "org",
        header: "Organization",
        cell: (o) => (
          <div>
            <div className="font-medium text-gray-900">{o.org_name}</div>
            <div className="text-xs text-gray-500">{o.org_category?.replace(/_/g, " ") || o.org_type || "—"}</div>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Authorized contact",
        cell: (o) => (
          <div className="text-sm">
            <div>{o.contact_name || "—"}{o.contact_role ? ` · ${o.contact_role}` : ""}</div>
            <div className="text-xs text-gray-500">{o.contact_phone || "—"}</div>
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (o) => <span className="text-sm text-gray-600">{o.contact_email || "—"}</span>,
      },
      {
        id: "verified",
        header: "Verified",
        cell: (o) => (
          <Badge className={o.is_verified ? "bg-green-100 text-green-800" : ""}>
            {o.is_verified ? "yes" : "no"}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organizer accounts</h1>
        <p className="text-sm text-gray-500">
          Login-linked organizer profiles that can submit camp applications.
        </p>
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No organizer accounts yet."
        footer={<p className="text-xs text-gray-500">{data?.total ?? 0} accounts</p>}
      />
    </div>
  );
}
