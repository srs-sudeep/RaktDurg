import { CitizenShell } from "@/components/CitizenShell";
import { useCitizenProfile } from "@/api/citizen";

export default function CitizenProfilePage() {
  const { data } = useCitizenProfile();

  const fields = [
    { label: "Full name", value: data?.name ?? "—" },
    { label: "Blood group", value: data?.blood_group ?? "—" },
    { label: "Phone", value: data?.contact_phone ?? "—" },
    { label: "Status", value: data?.status ?? "—" },
    { label: "ABHA reference", value: data?.abha_reference ?? "Not added" },
    { label: "Address", value: data?.address ?? "—" },
  ];

  return (
    <CitizenShell
      title="Your donor profile"
      subtitle="This is the donor record currently linked to your citizen account."
    >
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="border-b border-border pb-3">
            <dt className="text-[12px] font-medium text-muted-foreground">{f.label}</dt>
            <dd className="mt-1 text-[15px] font-medium text-foreground">{f.value}</dd>
          </div>
        ))}
      </dl>
    </CitizenShell>
  );
}
