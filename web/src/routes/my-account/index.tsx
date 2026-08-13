import { Link } from "react-router-dom";
import { CitizenShell } from "@/components/CitizenShell";
import {
  useCitizenBookings,
  useCitizenDonations,
  useCitizenProfile,
  useCitizenWallet,
} from "@/api/citizen";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function MyAccountPage() {
  const profile = useCitizenProfile();
  const wallet = useCitizenWallet();
  const donations = useCitizenDonations();
  const bookings = useCitizenBookings();

  return (
    <CitizenShell
      title="Welcome to your RaktDurg account"
      subtitle="Track your donor profile, blood credit wallet, donation history, and camp bookings."
    >
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryStat
            label="Blood group"
            value={profile.data?.blood_group ?? "—"}
            meta={profile.data?.name ?? "Profile"}
          />
          <SummaryStat
            label="Wallet balance"
            value={wallet.data ? `${wallet.data.wallet.balance}` : "—"}
            meta="Credits available"
          />
          <SummaryStat
            label="Donations"
            value={donations.data ? `${donations.data.length}` : "—"}
            meta="Recorded history"
          />
          <SummaryStat
            label="Bookings"
            value={
              bookings.data
                ? `${bookings.data.filter((b) => b.status !== "cancelled").length}`
                : "—"
            }
            meta="Active camp bookings"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground">Latest activity</h2>
            <div className="space-y-3">
              {(donations.data ?? []).slice(0, 3).map((item) => (
                <div key={item.donation_id} className="border-b border-border pb-3 last:border-0">
                  <p className="font-medium text-foreground">
                    {item.camp_name ?? "Donation"} · {formatDateTime(item.collection_datetime)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.location ?? "Blood bank"} ·{" "}
                    {item.volume_ml ? `${item.volume_ml} ml` : "Volume not recorded"}
                  </p>
                </div>
              ))}
              {donations.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">No donation history is recorded yet.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Quick actions</h2>
            <div className="flex flex-col gap-2">
              <Link to="/public/stock">
                <Button className="w-full">Check blood stock</Button>
              </Link>
              <Link to="/public/camps">
                <Button variant="outline" className="w-full">
                  Discover camps
                </Button>
              </Link>
              <Link to="/my-account/wallet">
                <Button variant="outline" className="w-full">
                  Open wallet
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {bookings.data?.[0]
                ? `Next booking: ${bookings.data[0].camp_name} on ${formatDate(bookings.data[0].requested_date)}`
                : "You do not have any camp bookings yet."}
            </p>
          </section>
        </div>
      </div>
    </CitizenShell>
  );
}

function SummaryStat({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}
