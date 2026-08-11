import { useMemo } from "react";
import { useOrganizerAccounts, type OrganizerAccount } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/panel";

export default function OrganizersPage() {
  const { data, isLoading } = useOrganizerAccounts();

  const columns = useMemo<DataTableColumn<OrganizerAccount>[]>(
    () => [
      {
        id: "org",
        header: "Organization",
        cell: (o) => (
          <div>
            <div className="font-medium text-slate-900">{o.org_name}</div>
            <div className="text-[11px] text-slate-500">{o.org_category?.replace(/_/g, " ") || o.org_type || "—"}</div>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Authorized contact",
        cell: (o) => (
          <div className="text-[13px]">
            <div>{o.contact_name || "—"}{o.contact_role ? ` · ${o.contact_role}` : ""}</div>
            <div className="text-[11px] text-slate-500">{o.contact_phone || "—"}</div>
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: (o) => <span className="text-[13px] text-slate-600">{o.contact_email || "—"}</span>,
      },
      {
        id: "verified",
        header: "Verified",
        cell: (o) => (
          <Badge className={o.is_verified ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}>
            {o.is_verified ? "yes" : "no"}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Organizer accounts"
        description="Login-linked organizer profiles that can submit camp applications."
      />
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No organizer accounts yet."
        footer={<p className="text-[11px] text-slate-500">{data?.total ?? 0} accounts</p>}
      />
    </div>
  );
}
