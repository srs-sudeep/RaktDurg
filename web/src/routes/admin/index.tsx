import { FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useErakkoshExport, useFeatureFlags, useLinkCitizen, useToggleFlag } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormActions, FormField, FormGrid, FormInput } from "@/components/ui/form";
import { PageHeader, Panel } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

export default function AdminPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const { data: flags, isLoading } = useFeatureFlags({ enabled: isSuperadmin });
  const toggle = useToggleFlag();
  const exportJob = useErakkoshExport();
  const linkCitizen = useLinkCitizen();

  async function onLinkCitizen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const result = await linkCitizen.mutateAsync({
        username: String(fd.get("username")),
        donor_id: String(fd.get("donor_id")),
      });
      showSuccessToast("Citizen linked", `${result.username} → ${result.donor_name}`);
      e.currentTarget.reset();
    } catch {
      /* errors toasted by api client */
    }
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="System"
        description="Citizen onboarding, feature flags, and e-RaktKosh export."
      />

      <Panel title="Link citizen account" description="Connect a citizen login to an existing donor profile.">
        <form onSubmit={onLinkCitizen} className="space-y-3">
          <FormGrid>
            <FormField label="Citizen username" htmlFor="username" required>
              <FormInput id="username" name="username" required />
            </FormField>
            <FormField label="Donor ID (UUID)" htmlFor="donor_id" required>
              <FormInput id="donor_id" name="donor_id" required />
            </FormField>
          </FormGrid>
          <FormActions>
            <Button type="submit" disabled={linkCitizen.isPending}>
              {linkCitizen.isPending ? "Linking…" : "Link account"}
            </Button>
          </FormActions>
        </form>
      </Panel>

      {isSuperadmin && (
        <>
          <Panel title="Feature flags">
            {isLoading ? (
              <p className="text-[13px] text-slate-500">Loading…</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200">
                {(flags ?? []).map((f) => (
                  <div key={f.name} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <div className="text-[13px] font-medium">{f.name}</div>
                      <div className="text-[11px] text-slate-500">{f.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            {
                              onSuccess: () => showSuccessToast("Flag updated", f.name),
                            }
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

          <Panel title="e-RaktKosh export">
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
        </>
      )}
    </div>
  );
}
