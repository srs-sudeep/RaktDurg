import { useMemo } from "react";
import { useOrganizerDirectory, type OrganizerDirectoryItem } from "@/api/admin";
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

export default function OrganizerDirectoryPage() {
  const table = useTableQuery({ defaultOrderBy: "source_serial", defaultOrder: "asc", pageSize: 100 });
  const { data, isLoading } = useOrganizerDirectory({
    page: table.page,
    q: table.q || undefined,
    category: table.filters.category || undefined,
    order_by: table.orderBy,
    order: table.order,
  });

  const columns = useMemo<DataTableColumn<OrganizerDirectoryItem>[]>(
    () => [
      {
        id: "source_serial",
        header: "#",
        className: "w-14",
        sortable: true,
        cell: (r) => <span className="text-[11px] text-slate-500">{r.source_serial ?? "—"}</span>,
      },
      {
        id: "org_name",
        header: "Organization",
        sortable: true,
        cell: (r) => (
          <div>
            <div className="font-medium text-slate-900">{r.org_name}</div>
            <div className="text-[11px] text-slate-500">{r.contact_role || "—"}</div>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        sortable: true,
        cell: (r) => <span className="text-[11px] capitalize text-slate-600">{r.category.replace(/_/g, " ")}</span>,
      },
      { id: "location", header: "Location", sortable: true, cell: (r) => r.location || "—" },
      {
        id: "mobile",
        header: "Mobile",
        cell: (r) => <span className="font-mono text-[12px]">{r.mobile || "—"}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No directory contacts match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search name or mobile…"
            filters={[
              {
                key: "category",
                label: "All categories",
                className: "w-52 capitalize",
                options: CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") })),
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
