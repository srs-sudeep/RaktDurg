import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useScanBarcode, useUnits } from "@/api/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { TablePagination, TableToolbar } from "@/components/ui/table-toolbar";
import { useTableQuery } from "@/lib/table-query";
import { showSuccessToast } from "@/lib/toast";
import { bloodGroupColor, cn, formatDateTime } from "@/lib/utils";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATES = ["collected", "tested", "separated", "stored", "reserved", "issued", "discarded", "expired"];

type UnitRow = {
  id: string;
  barcode: string;
  blood_group: string;
  lifecycle_state: string;
  expiry_datetime: string;
};

export default function UnitsPage() {
  const { user } = useAuth();
  const table = useTableQuery({ defaultOrderBy: "created_at", defaultOrder: "desc", pageSize: 50 });
  const scan = useScanBarcode();
  const [barcode, setBarcode] = useState("");
  const navigate = useNavigate();

  const { data, isLoading, error } = useUnits({
    facility_id: user?.facility_id,
    page: table.page,
    page_size: table.pageSize,
    q: table.q || undefined,
    blood_group: table.filters.blood_group || undefined,
    lifecycle_state: table.filters.lifecycle_state || undefined,
    order_by: table.orderBy,
    order: table.order,
  });

  const columns = useMemo<DataTableColumn<UnitRow>[]>(
    () => [
      {
        id: "barcode",
        header: "Barcode",
        sortable: true,
        cell: (u) => (
          <Link to={`/units/${u.id}`} className="font-medium text-primary hover:underline">
            {u.barcode}
          </Link>
        ),
      },
      {
        id: "blood_group",
        header: "Group",
        sortable: true,
        cell: (u) => (
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", bloodGroupColor(u.blood_group))}>
            {u.blood_group}
          </span>
        ),
      },
      {
        id: "lifecycle_state",
        header: "State",
        sortable: true,
        cell: (u) => <Badge>{u.lifecycle_state}</Badge>,
      },
      {
        id: "expiry_datetime",
        header: "Expiry",
        sortable: true,
        cell: (u) => <span className="text-muted-foreground">{formatDateTime(u.expiry_datetime)}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {error && <p className="text-[13px] text-destructive">Failed to load units.</p>}

      <DataTable
        columns={columns}
        rows={(data?.items ?? []) as UnitRow[]}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        onRowClick={(u) => navigate(`/units/${u.id}`)}
        emptyMessage="No units match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search barcode…"
            filters={[
              {
                key: "blood_group",
                label: "All groups",
                options: GROUPS.map((g) => ({ value: g, label: g })),
              },
              {
                key: "lifecycle_state",
                label: "All states",
                options: STATES.map((s) => ({ value: s, label: s })),
              },
            ]}
            filterValues={table.filters}
            onFilterChange={table.setFilter}
          >
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!barcode.trim()) return;
                scan.mutate(barcode.trim(), {
                  onSuccess: (res: { unit?: { barcode?: string; id?: string } }) => {
                    showSuccessToast("Unit found", res.unit?.barcode);
                    if (res.unit?.id) navigate(`/units/${res.unit.id}`);
                  },
                });
              }}
            >
              <Input
                placeholder="Scan barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-44"
              />
              <Button type="submit" disabled={scan.isPending}>
                Lookup
              </Button>
            </form>
          </TableToolbar>
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
