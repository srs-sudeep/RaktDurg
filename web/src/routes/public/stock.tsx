import { useSearchParams } from "react-router-dom";
import { usePublicStock } from "@/api/stock";
import { bloodGroupColor, cn, formatDateTime } from "@/lib/utils";

const DEFAULT_FACILITY_ID = import.meta.env.VITE_DEFAULT_FACILITY_ID ?? "";

const COMPONENT_LABELS: Record<string, string> = {
  whole_blood: "Whole Blood",
  prbc: "Red Blood Cells (PRBC)",
  platelets: "Platelets",
  ffp: "Fresh Frozen Plasma",
  cryo: "Cryoprecipitate",
  granulocytes: "Granulocytes",
};

export default function PublicStockPage() {
  const [params] = useSearchParams();
  const facilityId = params.get("facility") ?? DEFAULT_FACILITY_ID;

  const { data, isLoading, error } = usePublicStock(facilityId);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const groupedByBG: Record<string, Record<string, number>> = {};
  for (const entry of data?.entries ?? []) {
    if (!groupedByBG[entry.blood_group]) groupedByBG[entry.blood_group] = {};
    groupedByBG[entry.blood_group][entry.component_type] = entry.available_count;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <header className="border-b border-red-100 bg-white/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white font-bold">
              RD
            </div>
            <div>
              <p className="font-semibold text-gray-900">Durg District Blood Bank</p>
              <p className="text-xs text-gray-500">Real-time availability</p>
            </div>
          </div>
          <a
            href="/login"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Staff Login
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Blood Availability</h1>
          <p className="mt-1 text-gray-500">
            Check current blood component availability before visiting.
          </p>
          {data && (
            <p className="mt-2 text-xs text-gray-400">
              Updated {formatDateTime(data.as_of)} · Refreshes every 60 seconds
            </p>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
            Unable to load stock information. Please try again later.
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {bloodGroups.map((bg) => {
              const components = groupedByBG[bg] ?? {};
              const totalUnits = Object.values(components).reduce((s, v) => s + v, 0);
              return (
                <div
                  key={bg}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-white shadow-sm",
                    totalUnits === 0 ? "border-red-200" : "border-gray-200"
                  )}
                >
                  <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-bold",
                        bloodGroupColor(bg)
                      )}
                    >
                      {bg}
                    </span>
                    <span className="text-sm text-gray-600">
                      {totalUnits === 0 ? (
                        <span className="font-medium text-red-600">Not available</span>
                      ) : (
                        <span className="font-medium text-green-700">{totalUnits} units available</span>
                      )}
                    </span>
                  </div>
                  {totalUnits > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 py-3">
                      {Object.entries(components).map(([ct, count]) => (
                        <div
                          key={ct}
                          className="rounded-lg bg-gray-50 px-3 py-2 text-center"
                        >
                          <p className="text-xs text-gray-500">{COMPONENT_LABELS[ct] ?? ct}</p>
                          <p className="mt-0.5 font-semibold text-gray-800">{count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Note:</strong> This information is updated regularly but may not reflect the exact
          real-time inventory. For emergency blood requirements, please contact the blood bank directly
          at <strong>07882-220101</strong>.
        </div>
      </main>
    </div>
  );
}
