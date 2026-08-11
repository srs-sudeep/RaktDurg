import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApplyCamp, useCamps, useReviewCamp, type Camp } from "@/api/camps";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CampsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useCamps();
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
        id: "name",
        header: "Name",
        cell: (c) => (
          <div>
            <Link to={`/camps/${c.id}/coupons`} className="font-medium text-red-700 hover:underline">
              {c.camp_name}
            </Link>
            <div className="text-xs text-gray-500">{c.location}</div>
          </div>
        ),
      },
      { id: "date", header: "Date", cell: (c) => c.requested_date },
      {
        id: "venue",
        header: "Venue",
        cell: (c) => (
          <span className="text-xs text-gray-600">{(c.venue_mode || "—").replace(/_/g, " ")}</span>
        ),
      },
      { id: "status", header: "Status", cell: (c) => <Badge>{c.status}</Badge> },
      {
        id: "actions",
        header: "Actions",
        cell: (c) =>
          canApprove && (c.status === "submitted" || c.status === "under_review") ? (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => review.mutate({ id: c.id, action: "approve", coupon_prefix: "RD" })}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  review.mutate({ id: c.id, action: "reject", rejection_reason: "Not feasible" })
                }
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
    setShowApply(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Camps</h1>
          <p className="text-sm text-gray-500">
            Indian Red Cross Society, Durg — camp applications, approvals, and coupons.
          </p>
        </div>
        <div className="flex gap-2">
          {canReviewBookings && (
            <Link to="/camps/bookings"><Button variant="outline">Booking queue</Button></Link>
          )}
          {canApprove && <Link to="/camps/approval"><Button variant="outline">Approval queue</Button></Link>}
          {canApply && <Button onClick={() => setShowApply((v) => !v)}>{showApply ? "Cancel" : "Apply"}</Button>}
        </div>
      </div>

      {showApply && (
        <form onSubmit={onApply} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
          {!user?.facility_id && (
            <div className="sm:col-span-2">
              <Label>Host facility ID</Label>
              <Input name="host_facility_id" required />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label>Camp / organization camp name (शिविर का नाम)</Label>
            <Input name="camp_name" required />
          </div>
          <div>
            <Label>Requested date (संभावित तिथि)</Label>
            <Input name="requested_date" type="date" required />
          </div>
          <div>
            <Label>Expected donors (संभावित रक्तदाता)</Label>
            <Input
              name="expected_donors"
              type="number"
              min={1}
              max={1000}
              value={expectedDonors}
              onChange={(e) => setExpectedDonors(Number(e.target.value))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Venue mode (शिविर स्थान)</Label>
            <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="venue_mode"
                  checked={venueMode === "district_blood_bank"}
                  onChange={() => setVenueMode("district_blood_bank")}
                />
                जिला चिकित्सालय ब्लड बैंक
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="venue_mode"
                  checked={venueMode === "organizer_venue"}
                  onChange={() => setVenueMode("organizer_venue")}
                />
                संस्था द्वारा निर्धारित स्थान
              </label>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>
              {venueMode === "organizer_venue"
                ? "Exact venue address (विशिष्ट पता / स्थान)"
                : "Location (defaults to District Hospital Blood Bank, Durg)"}
            </Label>
            <Input
              name="location"
              required={venueMode === "organizer_venue"}
              placeholder={
                venueMode === "district_blood_bank"
                  ? "District Hospital Blood Bank, Durg"
                  : "Full venue address"
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label>
              Alternate dates (अन्य तिथियाँ)
              {expectedDonors > 350 ? " — required when >350 donors" : " — comma-separated YYYY-MM-DD"}
            </Label>
            <Input
              name="alternate_dates"
              placeholder="2026-09-15, 2026-09-22"
              required={expectedDonors > 350}
            />
          </div>
          <div>
            <Label>Special date note (विशेष तिथि)</Label>
            <Input name="special_date_note" placeholder="e.g. World Blood Donor Day" />
          </div>
          <div>
            <Label>Camps per year (वर्ष में कितनी बार)</Label>
            <Input name="camps_per_year" type="number" min={1} max={52} />
          </div>
          <div className="sm:col-span-2">
            <Label>Other notes (अन्य जानकारी)</Label>
            <Input name="notes" />
          </div>
          {apply.isError && (
            <p className="sm:col-span-2 text-sm text-red-700">
              {(apply.error as Error)?.message || "Could not submit camp application"}
            </p>
          )}
          <div className="flex items-end">
            <Button type="submit" disabled={apply.isPending}>Submit application</Button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No camp applications yet."
      />
    </div>
  );
}
