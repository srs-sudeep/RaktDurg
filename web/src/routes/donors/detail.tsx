import { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useCreateScreening, useDonor } from "@/api/donors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormActions, FormField, FormGrid, FormInput } from "@/components/ui/form";
import { PageHeader, Panel } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

export default function DonorDetailPage() {
  const { id = "" } = useParams();
  const { data: donor, isLoading, error } = useDonor(id);
  const screening = useCreateScreening(id);

  async function onScreen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const result = await screening.mutateAsync({
        donor_id: id,
        screening_datetime: new Date().toISOString(),
        vitals: {
          weight_kg: Number(fd.get("weight_kg")),
          bp_systolic: Number(fd.get("bp_systolic")),
          bp_diastolic: Number(fd.get("bp_diastolic")),
          pulse_bpm: Number(fd.get("pulse_bpm")),
          temperature_celsius: Number(fd.get("temperature_celsius")),
          hemoglobin_g_dl: Number(fd.get("hemoglobin_g_dl")),
        },
        questionnaire: {
          had_recent_illness: fd.get("had_recent_illness") === "on",
          had_recent_surgery: fd.get("had_recent_surgery") === "on",
          is_pregnant: false,
          had_tattoo_last_6m: false,
          had_sti: false,
          is_on_medication: false,
        },
        captured_offline: false,
      });
      const eligibility = (result as { eligibility_result?: string }).eligibility_result ?? "ok";
      showSuccessToast("Screening saved", eligibility);
      e.currentTarget.reset();
    } catch {
      /* errors toasted by api client */
    }
  }

  if (isLoading) return <p className="text-[13px] text-slate-500">Loading…</p>;
  if (error || !donor) return <p className="text-[13px] text-red-600">Donor not found.</p>;

  return (
    <div className="space-y-3">
      <PageHeader
        title={donor.name}
        description="Donor profile and eligibility screening."
        actions={
          <Link to="/donors" className="text-[13px] text-red-700 hover:underline">
            ← Donors
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        <Badge>{donor.blood_group}</Badge>
        <Badge>{donor.status}</Badge>
      </div>

      <Panel title="Identity">
        <dl className="grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] text-slate-500">Phone</dt>
            <dd>{donor.contact_phone}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">DOB</dt>
            <dd>{donor.date_of_birth}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Sex</dt>
            <dd>{donor.sex}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-slate-500">Age</dt>
            <dd>{donor.age_years ?? "—"}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="New screening" description="Capture vitals and quick deferral flags.">
        <form onSubmit={onScreen} className="space-y-3">
          <FormGrid cols={3}>
            {(
              [
                ["weight_kg", "Weight (kg)", "65"],
                ["bp_systolic", "BP sys", "120"],
                ["bp_diastolic", "BP dia", "80"],
                ["pulse_bpm", "Pulse", "72"],
                ["temperature_celsius", "Temp °C", "36.8"],
                ["hemoglobin_g_dl", "Hb g/dL", "14"],
              ] as const
            ).map(([name, label, def]) => (
              <FormField key={name} label={label} htmlFor={name} required>
                <FormInput id={name} name={name} type="number" step="0.1" defaultValue={def} required />
              </FormField>
            ))}
          </FormGrid>
          <div className="flex flex-wrap gap-4 text-[13px] text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="had_recent_illness" className="rounded border-slate-300" />
              Recent illness
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="had_recent_surgery" className="rounded border-slate-300" />
              Recent surgery
            </label>
          </div>
          <FormActions>
            <Button type="submit" disabled={screening.isPending}>
              {screening.isPending ? "Saving…" : "Save screening"}
            </Button>
          </FormActions>
        </form>
      </Panel>
    </div>
  );
}
