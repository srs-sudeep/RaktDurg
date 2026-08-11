import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthenticatedStock, type StockEntry } from "@/api/stock";
import { bloodGroupColor, cn, formatDateTime } from "@/lib/utils";

const COMPONENT_LABELS: Record<string, string> = {
  whole_blood: "Whole Blood",
  prbc: "PRBC",
  platelets: "Platelets",
  ffp: "FFP",
  cryo: "Cryo",
  granulocytes: "Granulocytes",
};

function StockBadge({ count }: { count: number }) {
  if (count === 0) return <span className="font-semibold text-red-600">0</span>;
  if (count <= 2) return <span className="font-semibold text-orange-500">{count}</span>;
  return <span className="font-semibold text-green-600">{count}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const facilityId = user?.facility_id ?? "";

  const { data, isLoading, error } = useAuthenticatedStock(facilityId);
  const [sseEntries, setSseEntries] = useState<StockEntry[] | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";
    const url = `${apiBase}/stream/stock/${facilityId}?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (Array.isArray(parsed.entries)) {
          setSseEntries(parsed.entries);
        }
      } catch {
        // ignore malformed events
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [facilityId]);

  const displayEntries = sseEntries ?? data?.entries ?? [];
  const groupedByType: Record<string, Record<string, number>> = {};
  for (const entry of displayEntries) {
    if (!groupedByType[entry.component_type]) groupedByType[entry.component_type] = {};
    groupedByType[entry.component_type][entry.blood_group] = entry.available_count;
  }

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Blood Stock</h1>
        {data && (
          <p className="text-sm text-gray-500">
            Last updated: {formatDateTime(data.as_of)}
            {sseEntries && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            )}
          </p>
        )}
        {!facilityId && (
          <p className="mt-2 text-sm text-amber-700">Your account has no facility assigned.</p>
        )}
      </div>

      {isLoading && !sseEntries && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load stock data.
        </div>
      )}

      {displayEntries.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByType).map(([compType, bgMap]) => (
            <div key={compType} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h2 className="font-semibold text-gray-800">
                  {COMPONENT_LABELS[compType] ?? compType}
                </h2>
              </div>
              <div className="grid grid-cols-4 gap-0 sm:grid-cols-8">
                {bloodGroups.map((bg) => (
                  <div
                    key={bg}
                    className={cn(
                      "flex flex-col items-center gap-1 border-r border-gray-100 p-4 last:border-0",
                      (bgMap[bg] ?? 0) === 0 && "bg-red-50"
                    )}
                  >
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", bloodGroupColor(bg))}>
                      {bg}
                    </span>
                    <StockBadge count={bgMap[bg] ?? 0} />
                    <span className="text-xs text-gray-400">units</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && displayEntries.length === 0 && facilityId && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          No stock data available for this facility.
        </div>
      )}
    </div>
  );
}
