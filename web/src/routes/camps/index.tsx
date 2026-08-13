import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApplyCamp, useCamps, useReviewCamp, type Camp } from "@/api/camps";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormActions, FormField, FormGrid, FormInput } from "@/components/ui/form";
import { Panel } from "@/components/ui/panel";
import { TablePagination, TableToolbar } from "@/components/ui/table-toolbar";
import { useTableQuery } from "@/lib/table-query";
import { showSuccessToast } from "@/lib/toast";

const CAMP_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "cancelled",
  "completed",
];

const CAMP_STATUS_COLORS: Record<string, string> = {
  approved: "border-success/30 bg-success/10 text-success",
  completed: "border-success/30 bg-success/10 text-success",
  submitted: "border-primary/25 bg-primary/10 text-primary",
  under_review: "border-warning/30 bg-warning/10 text-warning",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

export default function CampsPage() {
  const { user } = useAuth();
  const table = useTableQuery({ defaultOrderBy: "requested_date", defaultOrder: "desc", pageSize: 50 });
  const { data, isLoading } = useCamps({
    page: table.page,
    page_size: table.pageSize,
    q: table.q || undefined,
    camp_status: table.filters.camp_status || undefined,
    order_by: table.orderBy,
    order: table.order,
  });
  const apply = useApplyCamp();
  const review = useReviewCamp();
  const [showApply, setShowApply] = useState(false);
  const [venueMode, setVenueMode] = useState<"district_blood_bank" | "organizer_venue">(
    "district_blood_bank",
  );
  const [expectedDonors, setExpectedDonors] = useState(40);
  const canApprove = user?.role === "superadmin" || user?.role === "doctor";
  const canReviewBookings =
    user?.role === "superadmin" || user?.role === "doctor" || user?.role === "district_admin";
  const canApply = user?.role === "organizer" || user?.role === "superadmin";

  const columns = useMemo<DataTableColumn<Camp>[]>(
    () => [
      {
        id: "camp_name",
        header: "Name",
        sortable: true,
        cell: (c) => (
          <div>
            <Link to={`/camps/${c.id}/coupons`} className="font-medium text-primary hover:underline">
              {c.camp_name}
            </Link>
            <div className="text-[11px] text-muted-foreground">{c.location}</div>
          </div>
        ),
      },
      { id: "requested_date", header: "Date", sortable: true, cell: (c) => c.requested_date },
      {
        id: "venue",
        header: "Venue",
        cell: (c) => (
          <span className="text-[11px] text-muted-foreground">{(c.venue_mode || "—").replace(/_/g, " ")}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (c) => (
          <Badge className={CAMP_STATUS_COLORS[c.status] ?? ""}>
            {c.status.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (c) =>
          canApprove && (c.status === "submitted" || c.status === "under_review") ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                onClick={() => {
                  review.mutate(
                    { id: c.id, action: "approve", coupon_prefix: "RD" },
                    { onSuccess: () => showSuccessToast("Camp approved") }
                  );
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  review.mutate(
                    { id: c.id, action: "reject", rejection_reason: "Not feasible" },
                    { onSuccess: () => showSuccessToast("Camp rejected") }
                  );
                }}
              >
                Reject
              </Button>
            </div>
          ) : (
            "—"
          ),
      },
    ],
    [canApprove, review]
  );

  async function onApply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const alternateRaw = String(fd.get("alternate_dates") || "").trim();
    const alternate_dates = alternateRaw
      ? alternateRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const notes = String(fd.get("notes") || "").trim() || undefined;
    const special = String(fd.get("special_date_note") || "").trim() || undefined;
    const campsPerYearRaw = String(fd.get("camps_per_year") || "").trim();
    try {
      await apply.mutateAsync({
        host_facility_id: user?.facility_id || fd.get("host_facility_id"),
        camp_name: fd.get("camp_name"),
        requested_date: fd.get("requested_date"),
        venue_mode: venueMode,
        location:
          venueMode === "organizer_venue"
            ? fd.get("location")
            : fd.get("location") || "District Hospital Blood Bank, Durg",
        expected_donors: Number(fd.get("expected_donors")),
        alternate_dates,
        special_date_note: special,
        camps_per_year: campsPerYearRaw ? Number(campsPerYearRaw) : undefined,
        notes,
      });
      showSuccessToast("Camp application submitted");
      setShowApply(false);
    } catch {
      /* errors toasted by api client */
    }
  }

  return (
    <div className="space-y-4">
      {showApply && (
        <Panel title="Camp application" description="Indian Red Cross Society, District Durg fields">
          <form onSubmit={onApply} className="space-y-4">
            <FormGrid>
              {!user?.facility_id && (
                <FormField label="Host facility ID" htmlFor="host_facility_id" required className="sm:col-span-2">
                  <FormInput id="host_facility_id" name="host_facility_id" required />
                </FormField>
              )}
              <FormField label="Camp name" htmlFor="camp_name" required className="sm:col-span-2">
                <FormInput id="camp_name" name="camp_name" required />
              </FormField>
              <FormField label="Requested date" htmlFor="requested_date" required>
                <FormInput id="requested_date" name="requested_date" type="date" required />
              </FormField>
              <FormField label="Expected donors" htmlFor="expected_donors" required>
                <FormInput
                  id="expected_donors"
                  name="expected_donors"
                  type="number"
                  min={1}
                  max={1000}
                  value={expectedDonors}
                  onChange={(e) => setExpectedDonors(Number(e.target.value))}
                  required
                />
              </FormField>
              <FormField label="Venue mode" className="sm:col-span-2">
                <div className="flex flex-wrap gap-4 pt-1 text-[13px]">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      checked={venueMode === "district_blood_bank"}
                      onChange={() => setVenueMode("district_blood_bank")}
                    />
                    District hospital blood bank
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      checked={venueMode === "organizer_venue"}
                      onChange={() => setVenueMode("organizer_venue")}
                    />
                    Organizer venue
                  </label>
                </div>
              </FormField>
              <FormField
                label={venueMode === "organizer_venue" ? "Exact venue address" : "Location"}
                htmlFor="location"
                required={venueMode === "organizer_venue"}
                className="sm:col-span-2"
                hint={venueMode === "district_blood_bank" ? "Defaults to District Hospital Blood Bank, Durg" : undefined}
              >
                <FormInput
                  id="location"
                  name="location"
                  required={venueMode === "organizer_venue"}
                  placeholder={
                    venueMode === "district_blood_bank"
                      ? "District Hospital Blood Bank, Durg"
                      : "Full venue address"
                  }
                />
              </FormField>
              <FormField
                label="Alternate dates"
                htmlFor="alternate_dates"
                required={expectedDonors > 350}
                className="sm:col-span-2"
                hint="Comma-separated YYYY-MM-DD. Required when expected donors > 350."
              >
                <FormInput
                  id="alternate_dates"
                  name="alternate_dates"
                  placeholder="2026-09-15, 2026-09-22"
                  required={expectedDonors > 350}
                />
              </FormField>
              <FormField label="Special date note" htmlFor="special_date_note">
                <FormInput id="special_date_note" name="special_date_note" />
              </FormField>
              <FormField label="Camps per year" htmlFor="camps_per_year">
                <FormInput id="camps_per_year" name="camps_per_year" type="number" min={1} max={52} />
              </FormField>
              <FormField label="Notes" htmlFor="notes" className="sm:col-span-2">
                <FormInput id="notes" name="notes" />
              </FormField>
            </FormGrid>
            <FormActions flush>
              <Button type="submit" disabled={apply.isPending}>
                {apply.isPending ? "Submitting…" : "Submit application"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowApply(false)}>
                Cancel
              </Button>
            </FormActions>
          </form>
        </Panel>
      )}

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No camps match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search name or location…"
            filters={[
              {
                key: "camp_status",
                label: "All statuses",
                options: CAMP_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
              },
            ]}
            filterValues={table.filters}
            onFilterChange={table.setFilter}
          >
            {canReviewBookings && (
              <Link to="/camps/bookings">
                <Button variant="outline" size="sm">
                  Booking queue
                </Button>
              </Link>
            )}
            {canApprove && (
              <Link to="/camps/approval">
                <Button variant="outline" size="sm">
                  Approval queue
                </Button>
              </Link>
            )}
            {canApply && (
              <Button size="sm" onClick={() => setShowApply((v) => !v)}>
                {showApply ? "Close form" : "Apply"}
              </Button>
            )}
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
