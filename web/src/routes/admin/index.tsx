import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useErakkoshExport, useFeatureFlags, useLinkCitizen, useToggleFlag } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const { data: flags, isLoading } = useFeatureFlags({ enabled: isSuperadmin });
  const toggle = useToggleFlag();
  const exportJob = useErakkoshExport();
  const linkCitizen = useLinkCitizen();
  const [linkResult, setLinkResult] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function onLinkCitizen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLinkResult(null);
    setLinkError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await linkCitizen.mutateAsync({
        username: String(fd.get("username")),
        donor_id: String(fd.get("donor_id")),
      });
      setLinkResult(`Linked ${result.username} → ${result.donor_name}`);
      e.currentTarget.reset();
    } catch {
      setLinkError("Could not link account. Check username, donor ID, and that neither is already linked.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-gray-500">Citizen onboarding, feature flags, and e-RaktKosh export.</p>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Link citizen account</h2>
        <p className="mb-4 text-sm text-gray-500">
          Connect a citizen login to an existing donor profile after staff registration.
        </p>
        <form onSubmit={onLinkCitizen} className="grid max-w-lg gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="username">Citizen username</Label>
            <Input id="username" name="username" placeholder="citizen_ajay" required />
          </div>
          <div>
            <Label htmlFor="donor_id">Donor ID (UUID)</Label>
            <Input id="donor_id" name="donor_id" placeholder="Donor UUID from donors list" required />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={linkCitizen.isPending}>
              Link account
            </Button>
          </div>
        </form>
        {linkResult && <p className="mt-2 text-sm text-green-700">{linkResult}</p>}
        {linkError && <p className="mt-2 text-sm text-red-600">{linkError}</p>}
      </section>

      {isSuperadmin && (
        <>
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
            {exportJob.error && (
              <p className="mt-2 text-sm text-red-600">
                Export failed (mock adapter may still return an id).
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
