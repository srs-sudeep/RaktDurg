import { Link } from "react-router-dom";
import { PartnerLogos } from "@/components/PublicLayout";

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-red-50 to-gray-50 px-4 py-16 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <img src="/logo.svg" alt="RaktDurg" className="mx-auto h-28 w-28 md:mx-0" />
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              RaktDurg
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              District-level digital blood bank for Durg — real-time stock, camp management, and
              donor workflows that complement national e-RaktKosh.
            </p>
            <p className="mt-2 text-sm font-medium text-gray-500">
              By IBITF and IIT Bhilai · Powered by Recogx Init
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                to="/public/stock"
                className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Check Blood Availability
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Staff Login
              </Link>
            </div>
          </div>
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">For citizens</h2>
            <ul className="mt-4 space-y-3 text-left text-sm text-gray-600">
              <li>View public blood stock by group and component</li>
              <li>Find camps and donation opportunities in Durg district</li>
              <li>Access donor wallet when registered (feature flag)</li>
            </ul>
            <h2 className="mt-8 text-lg font-semibold text-gray-900">For staff</h2>
            <ul className="mt-4 space-y-3 text-left text-sm text-gray-600">
              <li>Manage units, donors, camps, and requisitions</li>
              <li>Offline mobile capture at blood donation camps</li>
              <li>Role-based access for district admin, doctors, and organisers</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">Our partners</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-500">
          RaktDurg is developed through a collaboration between IBITF, IIT Bhilai, and Recogx Init.
        </p>
        <div className="mt-10">
          <PartnerLogos size="lg" />
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-red-700">Public transparency</h3>
            <p className="mt-2 text-sm text-gray-600">
              Citizens can check available blood units without logging in — counts only, no patient
              data exposed.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-red-700">Camp-ready mobile</h3>
            <p className="mt-2 text-sm text-gray-600">
              Field staff register donors, run screenings, and sync offline when connectivity
              returns.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-red-700">District operations</h3>
            <p className="mt-2 text-sm text-gray-600">
              Full inventory lifecycle from collection through issue — aligned with NBTC guidelines.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
