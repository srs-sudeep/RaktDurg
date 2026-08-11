import { Link } from "react-router-dom";
import { FeatureIcon, HeroPattern } from "@/components/DecorativeGraphics";
import { BrandingFooter, BrandingLogo } from "@/components/Branding";
import { PartnerLogos } from "@/components/PublicLayout";

const MILESTONES = [
  { year: "2024", title: "Platform vision", desc: "IBITF and IIT Bhilai begin district blood bank digitisation for Durg." },
  { year: "2025", title: "RaktDurg launch", desc: "Inventory, camps, public stock, and mobile field capture go live." },
  { year: "Future", title: "e-RaktKosh sync", desc: "Planned integration with national blood bank registry." },
];

export default function AboutPage() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden border-b border-red-100 bg-gradient-to-br from-red-50 to-white px-4 py-14">
        <HeroPattern />
        <div className="relative mx-auto max-w-3xl text-center">
          <BrandingLogo size="lg" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900 md:text-4xl">About RaktDurg</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            A district-level digital blood bank platform built for Durg District Hospital and Chhattisgarh
            Red Cross.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <FeatureIcon type="heart" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Our mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            RaktDurg complements national e-RaktKosh with local inventory management, camp workflows, donor
            registration, and public stock visibility — so citizens and hospitals in Durg district always
            know what blood is available when every minute counts.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-gray-700">
            Developed as a collaboration between IBITF and IIT Bhilai, with technical implementation
            powered by Recogx Init.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
          <div className="mt-6 space-y-0">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="relative flex gap-4 pb-8 last:pb-0">
                {i < MILESTONES.length - 1 && (
                  <div className="absolute left-[1.125rem] top-8 h-full w-0.5 bg-red-100" />
                )}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {m.year.slice(2)}
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">{m.year}</p>
                  <h3 className="mt-1 font-semibold text-gray-900">{m.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white p-8">
          <PartnerLogos size="lg" />
          <Link
            to="/public/stock"
            className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            View public blood stock
          </Link>
          <BrandingFooter showAboutLink={false} />
        </div>
      </div>
    </div>
  );
}
