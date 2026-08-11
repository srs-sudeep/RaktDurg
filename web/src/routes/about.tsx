import { Link } from "react-router-dom";
import { BrandingFooter, BrandingLogo } from "@/components/Branding";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link to="/login" className="text-sm text-red-600 hover:underline">
            ← Back to login
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center px-4 py-12 text-center">
        <BrandingLogo size="lg" />

        <section className="mt-10 space-y-4 text-left text-sm leading-relaxed text-gray-700">
          <h2 className="text-lg font-semibold text-gray-900">About RaktDurg</h2>
          <p>
            RaktDurg is a district-level digital blood bank platform for Durg District Hospital
            and Chhattisgarh Red Cross. It complements national e-RaktKosh with local inventory,
            camp management, donor workflows, and public stock visibility.
          </p>
          <p>
            This platform is developed as a collaboration between IBITF and IIT Bhilai, with
            technical implementation powered by Recogx Init.
          </p>
        </section>

        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <img src="/IIT_Bhilai.svg" alt="IIT Bhilai" className="h-16 opacity-90" />
            <img src="/IBITF.jpeg" alt="IBITF" className="h-14 rounded-md object-contain" />
            <img src="/recogx.webp" alt="Recogx Init" className="h-10 object-contain" />
          </div>
          <BrandingFooter showAboutLink={false} />
        </div>
      </main>
    </div>
  );
}
