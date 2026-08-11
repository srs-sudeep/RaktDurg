import { Link } from "react-router-dom";
import { FeatureIcon, HeroPattern } from "@/components/DecorativeGraphics";
import { PartnerLogos } from "@/components/PublicLayout";

export default function ContactPage() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-4 py-12">
        <HeroPattern />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Contact Us</h1>
          <p className="mt-2 text-gray-600">
            Reach the Durg District blood bank team or our development partners.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm md:col-span-2">
            <div className="flex gap-4">
              <FeatureIcon type="heart" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Durg District Hospital Blood Bank</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Address</dt>
                    <dd className="mt-1 text-sm text-gray-700">MG Road, Durg, Chhattisgarh 491001</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</dt>
                    <dd className="mt-1">
                      <a href="tel:07882220101" className="text-lg font-bold text-red-600 hover:underline">
                        07882-220101
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Public stock</dt>
                    <dd className="mt-1">
                      <Link to="/public/stock" className="text-sm font-medium text-red-600 hover:underline">
                        View blood availability →
                      </Link>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <FeatureIcon type="shield" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Development partners</h2>
            <p className="mt-2 text-sm text-gray-600">
              Platform by IBITF and IIT Bhilai. Technical implementation powered by Recogx Init.
            </p>
            <div className="mt-6">
              <PartnerLogos />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <FeatureIcon type="ops" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Staff access</h2>
            <p className="mt-2 text-sm text-gray-600">
              District admin, doctors, and organisers use the staff portal. Demo credentials are in the
              project README for development.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Staff Login →
            </Link>
          </section>
        </div>

        <div className="mt-8 flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <FeatureIcon type="phone" />
          <div>
            <h3 className="font-semibold text-amber-900">Hours & emergencies</h3>
            <p className="mt-1 text-sm text-amber-800">
              The blood bank operates round the clock for emergency requirements. For non-urgent enquiries,
              visit during regular hospital hours or call the number above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
