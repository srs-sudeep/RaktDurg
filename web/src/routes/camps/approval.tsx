import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCamps, useReviewCamp, type Camp } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { applyClientTable, useTableQuery } from "@/lib/table-query";
import { showSuccessToast } from "@/lib/toast";

const PENDING = new Set(["submitted", "under_review"]);

export default function CampApprovalPage() {
  const table = useTableQuery({ defaultOrderBy: "requested_date", defaultOrder: "asc", pageSize: 100 });
  const { data, isLoading } = useCamps({
    page: table.page,
    page_size: table.pageSize,
    q: table.q || undefined,
    order_by: table.orderBy,
    order: table.order,
  });
  const review = useReviewCamp();

  const rows = useMemo(() => {
    const pending = (data?.items ?? []).filter((c) => PENDING.has(c.status));
    return applyClientTable(pending as unknown as Record<string, unknown>[], {
      q: table.q,
      searchKeys: ["camp_name", "location"],
      filters: table.filters,
      filterKeys: { camp_status: "status" },
      orderBy: table.orderBy,
      order: table.order,
    }) as unknown as Camp[];
  }, [data, table.q, table.filters, table.orderBy, table.order]);

  const columns = useMemo<DataTableColumn<Camp>[]>(
    () => [
      {
        id: "camp_name",
        header: "Camp",
        sortable: true,
        cell: (c) => (
          <div>
            <div className="font-medium text-foreground">{c.camp_name}</div>
            <div className="text-[11px] text-muted-foreground">
              {c.requested_date} · {c.location}
            </div>
          </div>
        ),
      },
      {
        id: "requested_date",
        header: "Date",
        sortable: true,
        cell: (c) => c.requested_date,
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (c) => (
          <Badge
            className={
              c.status === "under_review"
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-primary/25 bg-primary/10 text-primary"
            }
          >
            {c.status.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (c) => (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              disabled={review.isPending}
              onClick={() =>
                review.mutate(
                  { id: c.id, action: "approve", coupon_prefix: "RD" },
                  { onSuccess: () => showSuccessToast("Camp approved", c.camp_name) }
                )
              }
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={review.isPending}
              onClick={() =>
                review.mutate(
                  { id: c.id, action: "reject", rejection_reason: "Capacity" },
                  { onSuccess: () => showSuccessToast("Camp rejected", c.camp_name) }
                )
              }
            >
              Reject
            </Button>
          </div>
        ),
      },
    ],
    [review]
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No camps awaiting approval."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search camp or location…"
            filters={[
              {
                key: "camp_status",
                label: "All pending",
                options: [
                  { value: "submitted", label: "submitted" },
                  { value: "under_review", label: "under review" },
                ],
              },
            ]}
            filterValues={table.filters}
            onFilterChange={table.setFilter}
          >
            <Link to="/camps">
              <Button variant="outline" size="sm">
                All camps
              </Button>
            </Link>
          </TableToolbar>
        }
        footer={<p className="text-[12px] text-muted-foreground tabular-nums">{rows.length} in queue</p>}
      />
    </div>
  );
}
