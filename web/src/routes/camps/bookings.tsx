import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useCampBookings, useReviewCampBooking } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function CampBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("requested");
  const { data, isLoading } = useCampBookings(statusFilter || undefined);
  const review = useReviewCampBooking();
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function onReview(bookingId: string, action: "confirm" | "reject") {
    await review.mutateAsync({
      id: bookingId,
      action,
      review_notes: notes[bookingId] || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Camp bookings</h1>
          <p className="text-sm text-gray-500">Review citizen slot requests for approved camps.</p>
        </div>
        <Link to="/camps">
          <Button variant="outline">Back to camps</Button>
        </Link>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4"
        onSubmit={(e: FormEvent) => e.preventDefault()}
      >
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="requested">Requested</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </form>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Camp</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                (data ?? []).map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.camp_name}</div>
                      <div className="text-xs text-gray-500">
                        {b.requested_date} · {b.location}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{b.donor_name}</div>
                      <div className="text-xs text-gray-500">
                        {b.blood_group ?? "—"} · {b.donor_phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[b.status] ?? ""}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.notes ?? "—"}
                      {b.review_notes && (
                        <div className="mt-1 text-xs text-gray-400">Review: {b.review_notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "requested" ? (
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="Review notes (optional)"
                            value={notes[b.id] ?? ""}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [b.id]: e.target.value }))
                            }
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={review.isPending}
                              onClick={() => void onReview(b.id, "confirm")}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={review.isPending}
                              onClick={() => void onReview(b.id, "reject")}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
