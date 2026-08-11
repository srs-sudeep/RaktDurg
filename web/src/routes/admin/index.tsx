import { useAuth } from "@/context/AuthContext";
import { useErakkoshExport, useFeatureFlags, useToggleFlag } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

export default function AdminPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const { data: flags, isLoading } = useFeatureFlags({ enabled: isSuperadmin });
  const toggle = useToggleFlag();
  const exportJob = useErakkoshExport();

  if (!isSuperadmin) {
    return (
      <Panel title="System">
        <p className="text-[13px] text-slate-600">Only superadmin can manage feature flags and exports.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-3">
      <Panel title="Feature flags" description="Runtime switches for optional modules.">
        {isLoading ? (
          <p className="text-[13px] text-slate-500">Loading…</p>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200">
            {(flags ?? []).map((f) => (
              <div key={f.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="font-mono text-[13px] font-medium text-slate-900">{f.name}</div>
                  <div className="text-[12px] text-slate-500">{f.description}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={f.is_enabled ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}>
                    {f.is_enabled ? "on" : "off"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggle.isPending}
                    onClick={() =>
                      toggle.mutate(
                        { name: f.name, is_enabled: !f.is_enabled },
                        { onSuccess: () => showSuccessToast("Flag updated", f.name) }
                      )
                    }
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="e-RaktKosh export" description="Queue the daily national reporting package.">
        <Button
          disabled={exportJob.isPending}
          onClick={() =>
            exportJob.mutate(undefined, {
              onSuccess: (data) =>
                showSuccessToast("Export queued", `${data.submission_id} · ${data.export_date}`),
            })
          }
        >
          {exportJob.isPending ? "Triggering…" : "Trigger daily export"}
        </Button>
      </Panel>
    </div>
  );
}
