import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { usePublicStock } from "@/api/stock";
import { FeatureIcon, StockSkeleton } from "@/components/DecorativeGraphics";
import { PageLoader } from "@/components/SplashScreen";
import { bloodGroupColor, cn, formatDateTime } from "@/lib/utils";

const DEFAULT_FACILITY_ID = import.meta.env.VITE_DEFAULT_FACILITY_ID ?? "";

const COMPONENT_LABELS: Record<string, string> = {
  whole_blood: "Whole Blood",
  prbc: "PRBC",
  platelets: "Platelets",
  ffp: "FFP",
  cryo: "Cryo",
  granulocytes: "Granulocytes",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function availabilityLevel(total: number): "critical" | "low" | "ok" {
  if (total === 0) return "critical";
  if (total <= 3) return "low";
  return "ok";
}

export default function PublicStockPage() {
  const [params] = useSearchParams();
  const facilityId = params.get("facility") ?? DEFAULT_FACILITY_ID;

  const { data, isLoading, error, isFetching } = usePublicStock(facilityId);

  const groupedByBG: Record<string, Record<string, number>> = {};
  for (const entry of data?.entries ?? []) {
    if (!groupedByBG[entry.blood_group]) groupedByBG[entry.blood_group] = {};
    groupedByBG[entry.blood_group][entry.component_type] = entry.available_count;
  }

  const totals = BLOOD_GROUPS.map((bg) => {
    const components = groupedByBG[bg] ?? {};
    return Object.values(components).reduce((s, v) => s + v, 0);
  });
  const grandTotal = totals.reduce((s, v) => s + v, 0);
  const groupsInStock = totals.filter((t) => t > 0).length;
  const criticalCount = totals.filter((t) => t === 0).length;
  const maxUnits = Math.max(...totals, 1);

  return (
    <div className="relative min-h-full bg-gradient-to-b from-red-50 via-white to-gray-50">
      <div className="border-b border-red-100 bg-gradient-to-r from-red-600 to-red-700 px-4 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="" className="h-12 w-12 rounded-xl bg-white/10 p-1.5" />
                <div>
                  <p className="text-sm font-medium text-red-100">Durg District Blood Bank</p>
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Blood Availability</h1>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-red-100">
                Live component counts by blood group — updated regularly for citizens and hospitals.
              </p>
            </div>
            {data && (
              <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur-sm">
                {isFetching && (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Updated {formatDateTime(data.as_of)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {isLoading && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-sm">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
                </div>
              ))}
            </div>
            <StockSkeleton />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <FeatureIcon type="heart" />
            <p className="mt-4 text-lg font-semibold text-red-800">Unable to load stock</p>
            <p className="mt-1 text-sm text-red-600">Please try again later or call the blood bank directly.</p>
            <a
              href="tel:07882220101"
              className="mt-4 inline-block rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Call 07882-220101
            </a>
          </div>
        )}

        {data && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Total units available"
                value={grandTotal}
                accent="text-red-600"
                bg="from-red-50 to-white border-red-100"
              />
              <SummaryCard
                label="Groups in stock"
                value={`${groupsInStock} / 8`}
                accent="text-green-600"
                bg="from-green-50 to-white border-green-100"
              />
              <SummaryCard
                label="Critical shortages"
                value={criticalCount}
                accent={criticalCount > 0 ? "text-amber-600" : "text-gray-600"}
                bg="from-amber-50 to-white border-amber-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BLOOD_GROUPS.map((bg, idx) => {
                const components = groupedByBG[bg] ?? {};
                const totalUnits = totals[idx];
                const level = availabilityLevel(totalUnits);
                const fillPct = Math.round((totalUnits / maxUnits) * 100);

                return (
                  <div
                    key={bg}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md",
                      level === "critical" && "border-red-200 ring-1 ring-red-100",
                      level === "low" && "border-amber-200",
                      level === "ok" && "border-gray-200"
                    )}
                  >
                    {level === "critical" && (
                      <div className="absolute right-3 top-3 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                        Shortage
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-full px-3 py-1.5 text-base font-bold", bloodGroupColor(bg))}>
                        {bg}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          level === "critical" ? "text-red-600" : level === "low" ? "text-amber-600" : "text-green-700"
                        )}
                      >
                        {totalUnits}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            level === "critical" ? "bg-red-400" : level === "low" ? "bg-amber-400" : "bg-green-500"
                          )}
                          style={{ width: `${Math.max(fillPct, totalUnits > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {totalUnits === 0
                          ? "Not available — contact blood bank"
                          : `${totalUnits} unit${totalUnits !== 1 ? "s" : ""} across components`}
                      </p>
                    </div>

                    {totalUnits > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {Object.entries(components).map(([ct, count]) => (
                          <div
                            key={ct}
                            className="rounded-lg bg-gray-50 px-2.5 py-2 text-center transition group-hover:bg-gray-100"
                          >
                            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-400">
                              {COMPONENT_LABELS[ct] ?? ct}
                            </p>
                            <p className="text-sm font-bold text-gray-800">{count}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!isLoading && !data && !error && <PageLoader />}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="flex gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
            <FeatureIcon type="phone" />
            <div>
              <h3 className="font-semibold text-amber-900">Emergency requirement?</h3>
              <p className="mt-1 text-sm text-amber-800">
                Counts may lag real-time inventory. For urgent needs call{" "}
                <a href="tel:07882220101" className="font-bold underline">
                  07882-220101
                </a>
                .
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6">
            <FeatureIcon type="heart" />
            <div>
              <h3 className="font-semibold text-gray-900">Want to donate?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Every donation saves lives.{" "}
                <Link to="/contact" className="font-medium text-red-600 hover:underline">
                  Contact us
                </Link>{" "}
                to find upcoming camps in Durg district.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  bg,
}: {
  label: string;
  value: string | number;
  accent: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-6 shadow-sm", bg)}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={cn("mt-1 text-3xl font-bold tabular-nums", accent)}>{value}</p>
    </div>
  );
}
