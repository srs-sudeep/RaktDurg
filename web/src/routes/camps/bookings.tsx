import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCampBookings, useReviewCampBooking, type CampBooking } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormField, FormInput, FormSelect } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

const STATUS_COLORS: Record<string, string> = {
  requested: "border-amber-300 bg-amber-50 text-amber-900",
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-900",
  rejected: "border-red-300 bg-red-50 text-red-900",
  cancelled: "border-slate-300 bg-slate-50 text-slate-600",
};

export default function CampBookingsPage() {
  const [statusFilter, setStatusFilter] = useState("requested");
  const { data, isLoading } = useCampBookings(statusFilter || undefined);
  const review = useReviewCampBooking();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const columns = useMemo<DataTableColumn<CampBooking>[]>(
    () => [
      {
        id: "camp",
        header: "Camp",
        cell: (b) => (
          <div>
            <div className="font-medium text-slate-900">{b.camp_name}</div>
            <div className="text-[11px] text-slate-500">
              {b.requested_date} · {b.location}
            </div>
          </div>
        ),
      },
      {
        id: "donor",
        header: "Donor",
        cell: (b) => (
          <div>
            <div>{b.donor_name}</div>
            <div className="text-[11px] text-slate-500">
              {b.blood_group ?? "—"} · {b.donor_phone}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (b) => <Badge className={STATUS_COLORS[b.status] ?? ""}>{b.status}</Badge>,
      },
      {
        id: "notes",
        header: "Notes",
        cell: (b) => (
          <div className="max-w-[220px] text-[12px] text-slate-600">
            {b.notes ?? "—"}
            {b.review_notes ? (
              <div className="mt-0.5 text-[11px] text-slate-400">Review: {b.review_notes}</div>
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
            <span className="text-[11px] text-slate-400">Reviewed</span>
          ),
      },
    ],
    [notes, review]
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Camp bookings"
        description="Review citizen slot requests for approved camps."
        actions={
          <Link to="/camps">
            <Button variant="outline" size="sm">
              All camps
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        emptyMessage="No bookings found."
        toolbar={
          <FormField label="Status" htmlFor="booking_status" className="w-44">
            <FormSelect
              id="booking_status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="requested">Requested</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </FormSelect>
          </FormField>
        }
      />
    </div>
  );
}
