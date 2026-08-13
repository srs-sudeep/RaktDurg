import { useCreateCitizenBooking, usePublicCamps } from "@/api/citizen";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function PublicCampsPage() {
  const { user } = useAuth();
  const { data } = usePublicCamps();
  const createBooking = useCreateCitizenBooking();
  const canBook = user?.role === "citizen";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Upcoming donation camps</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse approved public donation camps in Durg district and request a booking from your citizen
          account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((camp) => (
          <div key={camp.id} className="surface-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">{camp.camp_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {camp.host_facility_name ?? "Durg District Blood Bank"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums text-primary">
                {formatDate(camp.requested_date)}
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{camp.location}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Expected donors: {camp.expected_donors ?? "Not specified"}
            </p>
            <div className="mt-5">
              {canBook ? (
                <Button
                  type="button"
                  onClick={() => createBooking.mutate({ campId: camp.id })}
                  disabled={createBooking.isPending}
                >
                  Request booking
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sign in as a citizen account to request a booking.
                </p>
              )}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <div className="surface-card p-6 text-sm text-muted-foreground md:col-span-2">
            No approved upcoming camps are published yet.
          </div>
        )}
      </div>
    </div>
  );
}
