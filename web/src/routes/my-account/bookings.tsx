import { CitizenShell } from "@/components/CitizenShell";
import { useCancelCitizenBooking, useCitizenBookings } from "@/api/citizen";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function CitizenBookingsPage() {
  const { data } = useCitizenBookings();
  const cancelBooking = useCancelCitizenBooking();

  return (
    <CitizenShell
      title="Camp bookings"
      subtitle="Track your requested donation camp slots and cancel them if needed."
    >
      <div className="space-y-4">
        {(data ?? []).map((booking) => (
          <div
            key={booking.id}
            className="flex flex-col gap-3 border-b border-border pb-4 last:border-0 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">{booking.camp_name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {booking.location} · {formatDate(booking.requested_date)} · {booking.status}
              </p>
              {booking.notes ? (
                <p className="mt-2 text-sm text-muted-foreground">{booking.notes}</p>
              ) : null}
            </div>
            {booking.status !== "cancelled" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cancelBooking.mutate(booking.id)}
                disabled={cancelBooking.isPending}
              >
                Cancel booking
              </Button>
            )}
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No camp bookings yet. Explore public camps to request a donation slot.
          </p>
        )}
      </div>
    </CitizenShell>
  );
}
