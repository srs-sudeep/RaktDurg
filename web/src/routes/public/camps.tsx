import { useCreateCitizenBooking, usePublicCamps } from "@/api/citizen";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

export default function PublicCampsPage() {
  const { user } = useAuth();
  const { data } = usePublicCamps();
  const createBooking = useCreateCitizenBooking();
  const canBook = user?.role === "citizen";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upcoming donation camps</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Browse approved public donation camps in Durg district and request a booking from your citizen account.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {(data ?? []).map((camp) => (
          <div key={camp.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{camp.camp_name}</h2>
                <p className="mt-1 text-sm text-gray-500">{camp.host_facility_name ?? "Durg District Blood Bank"}</p>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                {formatDate(camp.requested_date)}
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600">{camp.location}</p>
            <p className="mt-2 text-sm text-gray-500">
              Expected donors: {camp.expected_donors ?? "Not specified"}
            </p>
            <div className="mt-5">
              {canBook ? (
                <button
                  type="button"
                  onClick={() => createBooking.mutate({ campId: camp.id })}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Request booking
                </button>
              ) : (
                <p className="text-sm text-gray-500">Sign in as a citizen account to request a booking.</p>
              )}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            No approved upcoming camps are published yet.
          </div>
        )}
      </div>
    </div>
  );
}
