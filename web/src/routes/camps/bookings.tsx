import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCampBookings, useReviewCampBooking, type CampBooking } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormInput } from "@/components/ui/form";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { applyClientTable, useTableQuery } from "@/lib/table-query";
import { showSuccessToast } from "@/lib/toast";

const STATUS_COLORS: Record<string, string> = {
  requested: "border-warning/30 bg-warning/10 text-warning",
  confirmed: "border-success/30 bg-success/10 text-success",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

const BOOKING_STATUSES = ["requested", "confirmed", "rejected", "cancelled"];

export default function CampBookingsPage() {
  const table = useTableQuery({
    defaultOrderBy: "created_at",
    defaultOrder: "desc",
    defaultFilters: { status: "requested" },
  });
  const { data, isLoading } = useCampBookings({
    status: table.filters.status || undefined,
    q: table.q || undefined,
    order_by: table.orderBy,
    order: table.order,
  });
  const review = useReviewCampBooking();
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Server already filters/sorts; light client pass keeps UI snappy if status is cleared mid-type.
  const rows = useMemo(
    () =>
      applyClientTable((data ?? []) as unknown as Record<string, unknown>[], {
        q: table.q,
        searchKeys: ["camp_name", "donor_name", "donor_phone", "location"],
        orderBy: table.orderBy,
        order: table.order,
      }) as unknown as CampBooking[],
    [data, table.q, table.orderBy, table.order]
  );

  const columns = useMemo<DataTableColumn<CampBooking>[]>(
    () => [
      {
        id: "camp_name",
        header: "Camp",
        sortable: true,
        cell: (b) => (
          <div>
            <div className="font-medium text-foreground">{b.camp_name}</div>
            <div className="text-[11px] text-muted-foreground">
              {b.requested_date} · {b.location}
            </div>
          </div>
        ),
      },
      {
        id: "donor_name",
        header: "Donor",
        sortable: true,
        cell: (b) => (
          <div>
            <div>{b.donor_name}</div>
            <div className="text-[11px] text-muted-foreground">
              {b.blood_group ?? "—"} · {b.donor_phone}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (b) => <Badge className={STATUS_COLORS[b.status] ?? ""}>{b.status}</Badge>,
      },
      {
        id: "notes",
        header: "Notes",
        cell: (b) => (
          <div className="max-w-[220px] text-[12px] text-muted-foreground">
            {b.notes ?? "—"}
            {b.review_notes ? (
              <div className="mt-0.5 text-[11px] text-muted-foreground">Review: {b.review_notes}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (b) =>
          b.status === "requested" ? (
            <div className="flex min-w-[220px] flex-col gap-1.5">
              <FormInput
                placeholder="Review notes (optional)"
                value={notes[b.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [b.id]: e.target.value }))}
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  disabled={review.isPending}
                  onClick={() =>
                    review.mutate(
                      { id: b.id, action: "confirm", review_notes: notes[b.id] || undefined },
                      {
                        onSuccess: () => showSuccessToast("Booking confirmed", b.donor_name),
                      }
                    )
                  }
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={review.isPending}
                  onClick={() =>
                    review.mutate(
                      { id: b.id, action: "reject", review_notes: notes[b.id] || undefined },
                      {
                        onSuccess: () => showSuccessToast("Booking rejected", b.donor_name),
                      }
                    )
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">Reviewed</span>
          ),
      },
    ],
    [notes, review]
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        emptyMessage="No bookings match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search camp, donor, phone…"
            filters={[
              {
                key: "status",
                label: "All statuses",
                options: BOOKING_STATUSES.map((s) => ({ value: s, label: s })),
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
        footer={
          <p className="text-[12px] text-muted-foreground tabular-nums">
            {rows.length} booking{rows.length === 1 ? "" : "s"}
          </p>
        }
      />
    </div>
  );
}
