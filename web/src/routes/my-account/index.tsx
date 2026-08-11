import { Link } from "react-router-dom";
import { CitizenShell } from "@/components/CitizenShell";
import {
  useCitizenBookings,
  useCitizenDonations,
  useCitizenProfile,
  useCitizenWallet,
} from "@/api/citizen";
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
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Blood group"
          value={profile.data?.blood_group ?? "—"}
          subtext={profile.data?.name ?? "Profile"}
        />
        <SummaryCard
          label="Wallet balance"
          value={wallet.data ? `${wallet.data.wallet.balance}` : "—"}
          subtext="Credits available"
        />
        <SummaryCard
          label="Donations"
          value={donations.data ? `${donations.data.length}` : "—"}
          subtext="Recorded history"
        />
        <SummaryCard
          label="Bookings"
          value={bookings.data ? `${bookings.data.filter((b) => b.status !== "cancelled").length}` : "—"}
          subtext="Active camp bookings"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Latest activity</h2>
          <div className="mt-4 space-y-3">
            {(donations.data ?? []).slice(0, 3).map((item) => (
              <div key={item.donation_id} className="rounded-xl bg-gray-50 p-4">
                <p className="font-medium text-gray-900">
                  {item.camp_name ?? "Donation"} · {formatDateTime(item.collection_datetime)}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {item.location ?? "Blood bank"} · {item.volume_ml ? `${item.volume_ml} ml` : "Volume not recorded"}
                </p>
              </div>
            ))}
            {donations.data?.length === 0 && (
              <p className="text-sm text-gray-500">No donation history is recorded yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/public/stock" className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">
              Check blood stock
            </Link>
            <Link to="/public/camps" className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Discover camps
            </Link>
            <Link to="/my-account/wallet" className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Open wallet
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            {bookings.data?.[0]
              ? `Next booking: ${bookings.data[0].camp_name} on ${formatDate(bookings.data[0].requested_date)}`
              : "You do not have any camp bookings yet."}
          </div>
        </section>
      </div>
    </CitizenShell>
  );
}

function SummaryCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtext}</p>
    </div>
  );
}
