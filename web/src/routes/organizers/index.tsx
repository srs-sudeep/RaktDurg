import { useMemo } from "react";
import { useOrganizerAccounts, type OrganizerAccount } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { TablePagination, TableToolbar } from "@/components/ui/table-toolbar";
import { useTableQuery } from "@/lib/table-query";

const CATEGORIES = [
  "community_society",
  "social_org",
  "police_paramilitary",
  "govt_union",
  "educational",
  "industrial",
  "political",
  "departmental_officer",
  "other",
];

export default function OrganizersPage() {
  const table = useTableQuery({ defaultOrderBy: "org_name", defaultOrder: "asc", pageSize: 100 });
  const { data, isLoading } = useOrganizerAccounts({
    page: table.page,
    q: table.q || undefined,
    org_category: table.filters.org_category || undefined,
    is_verified: table.filters.is_verified || undefined,
    order_by: table.orderBy,
    order: table.order,
  });

  const columns = useMemo<DataTableColumn<OrganizerAccount>[]>(
    () => [
      {
        id: "org_name",
        header: "Organization",
        sortable: true,
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
        id: "is_verified",
        header: "Verified",
        sortable: true,
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
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No organizer accounts match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search org, contact, phone…"
            filters={[
              {
                key: "org_category",
                label: "All categories",
                className: "w-52 capitalize",
                options: CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") })),
              },
              {
                key: "is_verified",
                label: "Verified?",
                options: [
                  { value: "true", label: "Verified" },
                  { value: "false", label: "Unverified" },
                ],
              },
            ]}
            filterValues={table.filters}
            onFilterChange={table.setFilter}
          />
        }
        footer={
          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={data?.total ?? 0}
            onPageChange={table.setPage}
          />
        }
      />
    </div>
  );
}
