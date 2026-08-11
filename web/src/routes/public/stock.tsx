import { useSearchParams } from "react-router-dom";
import { usePublicStock } from "@/api/stock";
import { PageLoader } from "@/components/SplashScreen";
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
    <div className="bg-gradient-to-b from-red-50 to-white px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <img src="/logo.svg" alt="" className="mx-auto h-14 w-14" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Blood Availability</h1>
          <p className="mt-1 text-gray-500">
            Durg District Blood Bank — check current component availability.
          </p>
          {data && (
            <p className="mt-2 text-xs text-gray-400">
              Updated {formatDateTime(data.as_of)} · Refreshes every 60 seconds
            </p>
          )}
        </div>

        {isLoading && <PageLoader />}

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
          real-time inventory. For emergency blood requirements, contact the blood bank at{" "}
          <strong>07882-220101</strong>.
        </div>
      </div>
    </div>
  );
}
