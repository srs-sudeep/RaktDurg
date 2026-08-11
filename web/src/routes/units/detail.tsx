import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRecordTests, useTransitionUnit, useUnit } from "@/api/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

const NEXT: Record<string, string[]> = {
  collected: ["tested", "discarded"],
  tested: ["separated", "discarded"],
  separated: ["stored", "discarded"],
  stored: ["reserved", "expired", "discarded"],
  reserved: ["issued", "stored", "discarded"],
  issued: ["transfused"],
};

export default function UnitDetailPage() {
  const { id = "" } = useParams();
  const { data: unit, isLoading, error } = useUnit(id);
  const transition = useTransitionUnit();
  const tests = useRecordTests();
  const [msg, setMsg] = useState("");

  if (isLoading) return <p>Loading…</p>;
  if (error || !unit) return <p className="text-red-600">Unit not found.</p>;

  const nextStates = NEXT[unit.lifecycle_state] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/units" className="text-sm text-red-600 hover:underline">← Units</Link>
        <h1 className="mt-2 text-2xl font-bold">{unit.barcode}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{unit.blood_group}</Badge>
          <Badge>{unit.lifecycle_state}</Badge>
          <Badge>{unit.release_status}</Badge>
        </div>
      </div>

      <dl className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <div><dt className="text-xs text-gray-500">Collected</dt><dd>{formatDateTime(unit.collection_datetime)}</dd></div>
        <div><dt className="text-xs text-gray-500">Expiry</dt><dd>{formatDateTime(unit.expiry_datetime)}</dd></div>
        <div><dt className="text-xs text-gray-500">Donation</dt><dd className="font-mono text-xs">{unit.donation_id}</dd></div>
        <div><dt className="text-xs text-gray-500">Facility</dt><dd className="font-mono text-xs">{unit.facility_id}</dd></div>
      </dl>

      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        {nextStates.map((s) => (
          <Button
            key={s}
            variant="outline"
            disabled={transition.isPending}
            onClick={() =>
              transition.mutate(
                { id, target_state: s },
                {
                  onSuccess: () => setMsg(`Moved to ${s}`),
                  onError: (e: unknown) => setMsg((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Transition failed"),
                }
              )
            }
          >
            → {s}
          </Button>
        ))}
        <Button
          disabled={tests.isPending}
          onClick={() =>
            tests.mutate(
              {
                id,
                results: [
                  { test_panel: "HIV", result: "non_reactive" },
                  { test_panel: "HBsAg", result: "non_reactive" },
                  { test_panel: "HCV", result: "non_reactive" },
                  { test_panel: "Syphilis", result: "non_reactive" },
                  { test_panel: "Malaria", result: "non_reactive" },
                ],
              },
              { onSuccess: () => setMsg("TTI panel recorded"), onError: () => setMsg("Could not record tests") }
            )
          }
        >
          Record TTI panel
        </Button>
      </div>
    </div>
  );
}
