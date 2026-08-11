import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCreateScreening, useDonor } from "@/api/donors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DonorDetailPage() {
  const { id = "" } = useParams();
  const { data: donor, isLoading, error } = useDonor(id);
  const screening = useCreateScreening(id);
  const [msg, setMsg] = useState("");

  async function onScreen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const result =       await screening.mutateAsync({
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
      setMsg(`Screening saved: ${(result as { eligibility_result?: string }).eligibility_result ?? "ok"}`);
    } catch {
      setMsg("Screening failed");
    }
  }

  if (isLoading) return <p>Loading…</p>;
  if (error || !donor) return <p className="text-red-600">Donor not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/donors" className="text-sm text-red-600 hover:underline">← Donors</Link>
        <h1 className="mt-2 text-2xl font-bold">{donor.name}</h1>
        <div className="mt-2 flex gap-2"><Badge>{donor.blood_group}</Badge><Badge>{donor.status}</Badge></div>
      </div>
      <dl className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 text-sm">
        <div><dt className="text-xs text-gray-500">Phone</dt><dd>{donor.contact_phone}</dd></div>
        <div><dt className="text-xs text-gray-500">DOB</dt><dd>{donor.date_of_birth}</dd></div>
        <div><dt className="text-xs text-gray-500">Sex</dt><dd>{donor.sex}</dd></div>
        <div><dt className="text-xs text-gray-500">Age</dt><dd>{donor.age_years ?? "—"}</dd></div>
      </dl>

      <form onSubmit={onScreen} className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">New screening</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["weight_kg", "Weight (kg)", "65"],
            ["bp_systolic", "BP sys", "120"],
            ["bp_diastolic", "BP dia", "80"],
            ["pulse_bpm", "Pulse", "72"],
            ["temperature_celsius", "Temp °C", "36.8"],
            ["hemoglobin_g_dl", "Hb g/dL", "14"],
          ].map(([name, label, def]) => (
            <div key={name}><Label>{label}</Label><Input name={name} type="number" step="0.1" defaultValue={def} required /></div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="had_recent_illness" /> Recent illness</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="had_recent_surgery" /> Recent surgery</label>
        <Button type="submit" disabled={screening.isPending}>Save screening</Button>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </form>
    </div>
  );
}
