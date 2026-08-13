import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { usePublicStock } from "@/api/stock";
import { FeatureIcon, StockSkeleton } from "@/components/DecorativeGraphics";
import { PageLoader } from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
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
    <div className="relative min-h-full bg-gradient-to-b from-primary/5 via-card to-background">
      <div className="border-b border-primary/15 bg-gradient-to-r from-primary to-primary/80 px-4 py-12 text-primary-foreground">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="" className="h-12 w-12 rounded-xl bg-card/10 p-1.5" />
                <div>
                  <p className="text-sm font-medium text-primary-foreground/80">Durg District Blood Bank</p>
                  <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                    Blood Availability
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-primary-foreground/80">
                Live component counts by blood group — updated regularly for citizens and hospitals.
              </p>
            </div>
            {data && (
              <div className="flex items-center gap-2 rounded-lg bg-card/15 px-4 py-2 text-sm backdrop-blur-sm">
                {isFetching && (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                )}
                Updated {formatDateTime(data.as_of)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {isLoading && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="surface-card animate-pulse p-6">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="mt-3 h-8 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
            <StockSkeleton />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center surface-card border-destructive/30 bg-destructive/10 p-8 text-center">
            <FeatureIcon type="heart" />
            <p className="mt-4 text-lg font-semibold text-destructive">Unable to load stock</p>
            <p className="mt-1 text-sm text-destructive">
              Please try again later or call the blood bank directly.
            </p>
            <a href="tel:07882220101" className="mt-4">
              <Button>Call 07882-220101</Button>
            </a>
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Total units available" value={grandTotal} accent="text-primary" />
              <SummaryCard label="Groups in stock" value={`${groupsInStock} / 8`} accent="text-success" />
              <SummaryCard
                label="Critical shortages"
                value={criticalCount}
                accent={criticalCount > 0 ? "text-warning" : "text-muted-foreground"}
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
                      "surface-card relative p-5",
                      level === "critical" && "border-destructive/30 ring-1 ring-destructive/20",
                      level === "low" && "border-warning/30"
                    )}
                  >
                    {level === "critical" && (
                      <p className="absolute right-3 top-3 text-[10px] font-bold uppercase tracking-wide text-destructive">
                        Shortage
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-md px-2.5 py-1 text-base font-bold", bloodGroupColor(bg))}>
                        {bg}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          level === "critical"
                            ? "text-destructive"
                            : level === "low"
                              ? "text-warning"
                              : "text-success"
                        )}
                      >
                        {totalUnits}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            level === "critical"
                              ? "bg-destructive"
                              : level === "low"
                                ? "bg-warning"
                                : "bg-success"
                          )}
                          style={{ width: `${Math.max(fillPct, totalUnits > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {totalUnits === 0
                          ? "Not available — contact blood bank"
                          : `${totalUnits} unit${totalUnits !== 1 ? "s" : ""} across components`}
                      </p>
                    </div>

                    {totalUnits > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {Object.entries(components).map(([ct, count]) => (
                          <div key={ct} className="rounded-lg bg-muted px-2.5 py-2 text-center">
                            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {COMPONENT_LABELS[ct] ?? ct}
                            </p>
                            <p className="text-sm font-bold tabular-nums text-foreground">{count}</p>
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-4 rounded-xl border border-warning/30 bg-warning/10 p-6">
            <FeatureIcon type="phone" />
            <div>
              <h3 className="font-semibold text-warning">Emergency requirement?</h3>
              <p className="mt-1 text-sm text-warning">
                Counts may lag real-time inventory. For urgent needs call{" "}
                <a href="tel:07882220101" className="font-bold underline">
                  07882-220101
                </a>
                .
              </p>
            </div>
          </div>
          <div className="flex gap-4 surface-card p-6">
            <FeatureIcon type="heart" />
            <div>
              <h3 className="font-semibold text-foreground">Want to donate?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Every donation saves lives.{" "}
                <Link to="/contact" className="font-medium text-primary hover:underline">
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
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="surface-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-3xl font-semibold tabular-nums", accent)}>{value}</p>
    </div>
  );
}
