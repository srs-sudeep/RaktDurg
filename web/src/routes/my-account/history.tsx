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
          <h2 className="text-lg font-semibold text-gray-900">Donations</h2>
          {(data ?? []).map((item) => (
            <div key={item.donation_id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.camp_name ?? "Blood bank donation"}</h3>
                  <p className="text-sm text-gray-500">{item.location ?? "Durg District Blood Bank"}</p>
                </div>
                <div className="text-sm text-gray-500">{formatDateTime(item.collection_datetime)}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                  {item.donation_type}
                </span>
                {item.volume_ml && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                    {item.volume_ml} ml
                  </span>
                )}
              </div>
            </div>
          ))}
          {data?.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
              No donation history is available yet.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Certificates</h2>
          {certsLoading && <p className="text-sm text-gray-500">Loading certificates…</p>}
          {(certificates ?? []).map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{cert.certificate_number}</h3>
                <p className="text-sm text-gray-500">
                  {cert.donor_name} · {cert.blood_group ?? "—"} · {cert.donation_date}
                  {cert.volume_ml ? ` · ${cert.volume_ml} ml` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={downloading === cert.id}
                onClick={() => void onDownload(cert.id, cert.certificate_number)}
              >
                {downloading === cert.id ? "Downloading…" : "Download PDF"}
              </Button>
            </div>
          ))}
          {!certsLoading && certificates?.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
              Certificates appear here after a donation is recorded.
            </div>
          )}
        </section>
      </div>
    </CitizenShell>
  );
}
