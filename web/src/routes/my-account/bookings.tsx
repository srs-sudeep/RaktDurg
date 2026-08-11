import { CitizenShell } from "@/components/CitizenShell";
import { useCancelCitizenBooking, useCitizenBookings } from "@/api/citizen";
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
          <div key={booking.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{booking.camp_name}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {booking.location} · {formatDate(booking.requested_date)}
                </p>
                <p className="mt-3 text-sm text-gray-600">{booking.notes ?? "No notes added."}</p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                  {booking.status}
                </span>
                {booking.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => cancelBooking.mutate(booking.id)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            No camp bookings yet. Explore public camps to request a donation slot.
          </div>
        )}
      </div>
    </CitizenShell>
  );
}
