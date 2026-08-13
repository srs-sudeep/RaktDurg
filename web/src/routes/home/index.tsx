import { Link } from "react-router-dom";
import { FeatureIcon, HeroPattern } from "@/components/DecorativeGraphics";
import { PartnerLogos } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";

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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-background px-4 py-16 md:py-24">
        <HeroPattern />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:items-center">
          <div className="flex-1 text-center md:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Durg District Blood Bank
            </span>
            <img src="/logo.svg" alt="RaktDurg" className="mx-auto mt-6 h-28 w-28 md:mx-0" />
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Saving lives through{" "}
              <span className="text-primary">smarter blood banking</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Real-time stock visibility, camp management, and donor workflows — complementing national
              e-RaktKosh for Durg district.
            </p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              By IBITF and IIT Bhilai · Powered by Recogx Init
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link to="/public/stock">
                <Button size="lg">Check Blood Availability</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Staff Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-full max-w-lg flex-1">
            <div className="surface-card p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <AudienceCard
                  title="For citizens"
                  items={[
                    "View public blood stock by group",
                    "Find donation camps in Durg",
                    "Access donor wallet (coming soon)",
                  ]}
                />
                <AudienceCard
                  title="For staff"
                  items={[
                    "Manage units, donors & camps",
                    "Offline mobile at blood camps",
                    "Role-based district access",
                  ]}
                />
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl bg-sidebar px-5 py-4 text-sidebar-foreground">
                <div>
                  <p className="text-xs font-medium text-sidebar-muted">Emergency line</p>
                  <p className="text-lg font-semibold tabular-nums">07882-220101</p>
                </div>
                <Link
                  to="/contact"
                  className="rounded-lg bg-card/15 px-4 py-2 text-xs font-semibold transition hover:bg-card/25"
                >
                  Contact us →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-2xl font-semibold text-foreground">
            Built for Durg district
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Three pillars that make RaktDurg a complete blood bank platform.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="surface-card p-6">
                <FeatureIcon type={f.icon} />
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-foreground">Our partners</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          RaktDurg is developed through a collaboration between IBITF, IIT Bhilai, and Recogx Init.
        </p>
        <div className="mt-10 surface-card p-10">
          <PartnerLogos size="lg" />
        </div>
      </section>
    </>
  );
}

function AudienceCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2 text-left text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
