import { CitizenShell } from "@/components/CitizenShell";
import { useCitizenDonations } from "@/api/citizen";
import { formatDateTime } from "@/lib/utils";

export default function CitizenHistoryPage() {
  const { data } = useCitizenDonations();

  return (
    <CitizenShell
      title="Donation history"
      subtitle="Past donations linked to your donor profile."
    >
      <div className="space-y-4">
        {(data ?? []).map((item) => (
          <div key={item.donation_id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{item.camp_name ?? "Blood bank donation"}</h2>
                <p className="text-sm text-gray-500">{item.location ?? "Durg District Blood Bank"}</p>
              </div>
              <div className="text-sm text-gray-500">{formatDateTime(item.collection_datetime)}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                {item.donation_type}
              </span>
              {item.volume_ml && (
                <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                  {item.volume_ml} ml
                </span>
              )}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            No donation history is available yet.
          </div>
        )}
      </div>
    </CitizenShell>
  );
}
