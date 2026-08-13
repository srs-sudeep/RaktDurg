import { Link } from "react-router-dom";
import { FeatureIcon, HeroPattern } from "@/components/DecorativeGraphics";
import { BrandingFooter, BrandingLogo } from "@/components/Branding";
import { PartnerLogos } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";

const MILESTONES = [
  {
    year: "2024",
    title: "Platform vision",
    desc: "IBITF and IIT Bhilai begin district blood bank digitisation for Durg.",
  },
  {
    year: "2025",
    title: "RaktDurg launch",
    desc: "Inventory, camps, public stock, and mobile field capture go live.",
  },
  {
    year: "Future",
    title: "e-RaktKosh sync",
    desc: "Planned integration with national blood bank registry.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 to-card px-4 py-14">
        <HeroPattern />
        <div className="relative mx-auto max-w-3xl text-center">
          <BrandingLogo size="lg" />
          <h1 className="mt-6 font-display text-3xl font-semibold text-foreground md:text-4xl">
            About RaktDurg
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            A district-level digital blood bank platform built for Durg District Hospital and
            Chhattisgarh Red Cross.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href="https://rakt-durg-docs.vercel.app/" target="_blank" rel="noopener noreferrer">
              <Button>Developer docs</Button>
            </a>
            <Link to="/public/stock">
              <Button variant="outline">Public blood stock</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <section className="surface-card p-8">
          <FeatureIcon type="heart" />
          <h2 className="mt-4 font-display text-lg font-semibold text-foreground">Our mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            RaktDurg complements national e-RaktKosh with local inventory management, camp workflows,
            donor registration, and public stock visibility — so citizens and hospitals in Durg
            district always know what blood is available when every minute counts.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            Developed as a collaboration between IBITF and IIT Bhilai, with technical implementation
            powered by Recogx Init.
          </p>
        </section>

        <section className="surface-card p-8">
          <h2 className="font-display text-lg font-semibold text-foreground">Resources</h2>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              <span className="font-medium text-foreground">Documentation: </span>
              <a
                href="https://rakt-durg-docs.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary"
              >
                rakt-durg-docs.vercel.app
              </a>
            </li>
            <li>
              <span className="font-medium text-foreground">Live app: </span>
              <a href="/" className="text-primary underline hover:text-primary">
                District web portal
              </a>
            </li>
            <li>
              <span className="font-medium text-foreground">Monitoring: </span>
              <a href="/grafana/" className="text-primary underline hover:text-primary">
                Grafana dashboards
              </a>
            </li>
            <li>
              <span className="font-medium text-foreground">Mobile releases: </span>
              <a
                href="https://github.com/srs-sudeep/RaktDurg/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary"
              >
                GitHub Releases (APK + iOS artifacts)
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Timeline</h2>
          <div className="mt-6 space-y-0">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="relative flex gap-4 pb-8 last:pb-0">
                {i < MILESTONES.length - 1 && (
                  <div className="absolute left-[1.125rem] top-8 h-full w-0.5 bg-primary/15" />
                )}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {m.year.slice(2)}
                </div>
                <div className="flex-1 border-b border-border pb-6 last:border-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{m.year}</p>
                  <h3 className="mt-1 font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center gap-6 surface-card p-8">
          <PartnerLogos size="lg" />
          <Link to="/public/stock">
            <Button>View public blood stock</Button>
          </Link>
          <BrandingFooter showAboutLink={false} />
        </div>
      </div>
    </div>
  );
}
