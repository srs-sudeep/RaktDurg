import { BrandingFooter, BrandingLogo } from "@/components/Branding";
import { PartnerLogos } from "@/components/PublicLayout";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <BrandingLogo size="lg" />
      </div>

      <section className="mt-10 space-y-4 text-sm leading-relaxed text-gray-700">
        <h2 className="text-lg font-semibold text-gray-900">About RaktDurg</h2>
        <p>
          RaktDurg is a district-level digital blood bank platform for Durg District Hospital and
          Chhattisgarh Red Cross. It complements national e-RaktKosh with local inventory, camp
          management, donor workflows, and public stock visibility.
        </p>
        <p>
          This platform is developed as a collaboration between IBITF and IIT Bhilai, with technical
          implementation powered by Recogx Init.
        </p>
      </section>

      <div className="mt-10 flex flex-col items-center gap-6">
        <PartnerLogos size="lg" />
        <BrandingFooter showAboutLink={false} />
      </div>
    </div>
  );
}
