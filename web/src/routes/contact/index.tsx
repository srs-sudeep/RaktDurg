import { Link } from "react-router-dom";
import { FeatureIcon, HeroPattern } from "@/components/DecorativeGraphics";
import { PartnerLogos } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 to-card px-4 py-12">
        <HeroPattern />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Contact Us</h1>
          <p className="mt-2 text-muted-foreground">
            Reach the Durg District blood bank team or our development partners.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          <section className="surface-card p-6 md:col-span-2">
            <div className="flex gap-4">
              <FeatureIcon type="heart" />
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Durg District Hospital Blood Bank
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Address
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">MG Road, Durg, Chhattisgarh 491001</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phone
                    </dt>
                    <dd className="mt-1">
                      <a href="tel:07882220101" className="text-lg font-semibold tabular-nums text-primary hover:underline">
                        07882-220101
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Public stock
                    </dt>
                    <dd className="mt-1">
                      <Link to="/public/stock" className="text-sm font-medium text-primary hover:underline">
                        View blood availability →
                      </Link>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section className="surface-card p-6">
            <FeatureIcon type="shield" />
            <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
              Development partners
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Platform by IBITF and IIT Bhilai. Technical implementation powered by Recogx Init.
            </p>
            <div className="mt-6">
              <PartnerLogos />
            </div>
          </section>

          <section className="surface-card p-6">
            <FeatureIcon type="ops" />
            <h2 className="mt-4 font-display text-lg font-semibold text-foreground">Staff access</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              District admin, doctors, and organisers use the staff portal. Demo credentials are in the
              project README for development.
            </p>
            <Link to="/login" className="mt-4 inline-block">
              <Button>Staff Login →</Button>
            </Link>
          </section>
        </div>

        <div className="flex gap-4 rounded-xl border border-warning/30 bg-warning/10 p-6">
          <FeatureIcon type="phone" />
          <div>
            <h3 className="font-semibold text-warning">Hours & emergencies</h3>
            <p className="mt-1 text-sm text-warning">
              The blood bank operates round the clock for emergency requirements. For non-urgent
              enquiries, visit during regular hospital hours or call the number above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
