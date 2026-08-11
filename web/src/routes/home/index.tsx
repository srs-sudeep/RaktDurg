import { Link } from "react-router-dom";
import { FeatureIcon, HeroPattern } from "@/components/DecorativeGraphics";
import { PartnerLogos } from "@/components/PublicLayout";

const FEATURES = [
  {
    icon: "stock" as const,
    title: "Public transparency",
    body: "Citizens check available blood units without logging in — counts only, no patient data exposed.",
  },
  {
    icon: "camp" as const,
    title: "Camp-ready mobile",
    body: "Field staff register donors, run screenings, and sync offline when connectivity returns.",
  },
  {
    icon: "ops" as const,
    title: "District operations",
    body: "Full inventory lifecycle from collection through issue — aligned with NBTC guidelines.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-gray-50 px-4 py-16 md:py-24">
        <HeroPattern />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:items-center">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
              Durg District Blood Bank
            </span>
            <img src="/logo.svg" alt="RaktDurg" className="mx-auto mt-6 h-28 w-28 md:mx-0" />
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Saving lives through{" "}
              <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                smarter blood banking
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-gray-600">
              Real-time stock visibility, camp management, and donor workflows — complementing national
              e-RaktKosh for Durg district.
            </p>
            <p className="mt-2 text-sm font-medium text-gray-500">
              By IBITF and IIT Bhilai · Powered by Recogx Init
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                to="/public/stock"
                className="rounded-xl bg-red-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 hover:shadow-red-600/30"
              >
                Check Blood Availability
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Staff Login
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
              <div className="grid gap-6 sm:grid-cols-2">
                <AudienceCard
                  title="For citizens"
                  items={[
                    "View public blood stock by group",
                    "Find donation camps in Durg",
                    "Access donor wallet (coming soon)",
                  ]}
                  accent="border-red-100 bg-red-50/50"
                />
                <AudienceCard
                  title="For staff"
                  items={[
                    "Manage units, donors & camps",
                    "Offline mobile at blood camps",
                    "Role-based district access",
                  ]}
                  accent="border-gray-100 bg-gray-50/50"
                />
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-white">
                <div>
                  <p className="text-xs font-medium text-red-100">Emergency line</p>
                  <p className="text-lg font-bold">07882-220101</p>
                </div>
                <Link
                  to="/contact"
                  className="rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/30"
                >
                  Contact us →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">Built for Durg district</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-500">
            Three pillars that make RaktDurg a complete blood bank platform.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/50 p-6 shadow-sm transition hover:border-red-100 hover:shadow-md"
              >
                <FeatureIcon type={f.icon} />
                <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-red-700">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">Our partners</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-500">
          RaktDurg is developed through a collaboration between IBITF, IIT Bhilai, and Recogx Init.
        </p>
        <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-10 shadow-sm">
          <PartnerLogos size="lg" />
        </div>
      </section>
    </>
  );
}

function AudienceCard({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent}`}>
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-left text-sm text-gray-600">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
