import { CitizenShell } from "@/components/CitizenShell";
import { useCitizenProfile } from "@/api/citizen";

export default function CitizenProfilePage() {
  const { data } = useCitizenProfile();

  return (
    <CitizenShell
      title="Your donor profile"
      subtitle="This is the donor record currently linked to your citizen account."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FieldCard label="Full name" value={data?.name ?? "—"} />
        <FieldCard label="Blood group" value={data?.blood_group ?? "—"} />
        <FieldCard label="Phone" value={data?.contact_phone ?? "—"} />
        <FieldCard label="Status" value={data?.status ?? "—"} />
        <FieldCard label="ABHA reference" value={data?.abha_reference ?? "Not added"} />
        <FieldCard label="Address" value={data?.address ?? "—"} />
      </div>
    </CitizenShell>
  );
}

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
