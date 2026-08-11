import { useErakkoshExport, useFeatureFlags, useToggleFlag } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { data: flags, isLoading } = useFeatureFlags();
  const toggle = useToggleFlag();
  const exportJob = useErakkoshExport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-gray-500">Feature flags and e-RaktKosh export.</p>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Feature flags</h2>
        {isLoading ? <p>Loading…</p> : (
          <ul className="space-y-3">
            {(flags ?? []).map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={f.is_enabled ? "bg-green-100 text-green-800" : ""}>
                    {f.is_enabled ? "on" : "off"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate({ name: f.name, is_enabled: !f.is_enabled })}
                  >
                    Toggle
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">e-RaktKosh export</h2>
        <Button
          disabled={exportJob.isPending}
          onClick={() => exportJob.mutate()}
        >
          Trigger daily export
        </Button>
        {exportJob.data && (
          <p className="mt-2 text-sm text-gray-600">
            Submission {exportJob.data.submission_id} for {exportJob.data.export_date}
          </p>
        )}
        {exportJob.error && <p className="mt-2 text-sm text-red-600">Export failed (mock adapter may still return an id).</p>}
      </section>
    </div>
  );
}
