import { useState } from "react";
import { CitizenShell } from "@/components/CitizenShell";
import {
  downloadCitizenCertificatePdf,
  useCitizenCertificates,
  useCitizenDonations,
} from "@/api/citizen";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default function CitizenHistoryPage() {
  const { data } = useCitizenDonations();
  const { data: certificates, isLoading: certsLoading } = useCitizenCertificates();
  const [downloading, setDownloading] = useState<string | null>(null);

  async function onDownload(id: string, number: string) {
    setDownloading(id);
    try {
      await downloadCitizenCertificatePdf(id, number);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <CitizenShell
      title="Donation history"
      subtitle="Past donations and downloadable certificates linked to your donor profile."
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Donations</h2>
          {(data ?? []).map((item) => (
            <div key={item.donation_id} className="border-b border-border pb-4 last:border-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {item.camp_name ?? "Blood bank donation"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.location ?? "Durg District Blood Bank"}
                    {item.donation_type ? ` · ${item.donation_type}` : ""}
                    {item.volume_ml ? ` · ${item.volume_ml} ml` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {formatDateTime(item.collection_datetime)}
                </p>
              </div>
            </div>
          ))}
          {data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No donation history is available yet.</p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Certificates</h2>
          {certsLoading && <p className="text-sm text-muted-foreground">Loading certificates…</p>}
          {(certificates ?? []).map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col gap-3 border-b border-border pb-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-semibold text-foreground">{cert.certificate_number}</h3>
                <p className="text-sm text-muted-foreground">
                  {cert.donor_name} · {cert.blood_group ?? "—"} · {cert.donation_date}
                  {cert.volume_ml ? ` · ${cert.volume_ml} ml` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={downloading === cert.id}
                onClick={() => void onDownload(cert.id, cert.certificate_number)}
              >
                {downloading === cert.id ? "Downloading…" : "Download PDF"}
              </Button>
            </div>
          ))}
          {!certsLoading && certificates?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Certificates appear here after a donation is recorded.
            </p>
          )}
        </section>
      </div>
    </CitizenShell>
  );
}
