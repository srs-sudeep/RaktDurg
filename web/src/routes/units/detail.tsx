import { Link, useParams } from "react-router-dom";
import { useRecordTests, useTransitionUnit, useUnit } from "@/api/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";
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

  if (isLoading) return <p className="text-[13px] text-slate-500">Loading…</p>;
  if (error || !unit) return <p className="text-[13px] text-red-600">Unit not found.</p>;

  const nextStates = NEXT[unit.lifecycle_state] ?? [];

  return (
    <div className="space-y-3">
      <PageHeader
        title={unit.barcode}
        description="Unit lifecycle, release status, and TTI actions."
        actions={
          <Link to="/units" className="text-[13px] text-red-700 hover:underline">
            ← Units
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        <Badge>{unit.blood_group}</Badge>
        <Badge>{unit.lifecycle_state}</Badge>
        <Badge>{unit.release_status}</Badge>
      </div>

      <Panel title="Details">
        <dl className="grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] text-slate-500">Collected</dt>
            <dd>{formatDateTime(unit.collection_datetime)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Expiry</dt>
            <dd>{formatDateTime(unit.expiry_datetime)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Donation</dt>
            <dd className="font-mono text-[12px]">{unit.donation_id}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Facility</dt>
            <dd className="font-mono text-[12px]">{unit.facility_id}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Actions" description="Advance lifecycle or record a standard TTI panel.">
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
                    onSuccess: () => showSuccessToast("State updated", `Moved to ${s}`),
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
                {
                  onSuccess: () => showSuccessToast("TTI panel recorded"),
                }
              )
            }
          >
            Record TTI panel
          </Button>
        </div>
      </Panel>
    </div>
  );
}
