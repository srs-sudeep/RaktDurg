import { Link } from "react-router-dom";
import { PartnerLogos } from "@/components/PublicLayout";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
      <p className="mt-2 text-gray-600">
        Reach the Durg District blood bank team or our development partners.
      </p>

      <div className="mt-10 space-y-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Durg District Hospital Blood Bank</h2>
          <dl className="mt-4 space-y-2 text-sm text-gray-700">
            <div>
              <dt className="font-medium text-gray-500">Address</dt>
              <dd>MG Road, Durg, Chhattisgarh 491001</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Phone</dt>
              <dd>
                <a href="tel:07882220101" className="text-red-600 hover:underline">
                  07882-220101
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Public stock</dt>
              <dd>
                <Link to="/public/stock" className="text-red-600 hover:underline">
                  View blood availability online
                </Link>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Development partners</h2>
          <p className="mt-2 text-sm text-gray-600">
            Platform by IBITF and IIT Bhilai. Technical implementation powered by Recogx Init.
          </p>
          <div className="mt-6">
            <PartnerLogos />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Staff access</h2>
          <p className="mt-2 text-sm text-gray-600">
            District admin, doctors, and organisers should use the staff portal. Demo credentials are
            in the project README for development environments.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Staff Login
          </Link>
        </section>
      </div>
    </div>
  );
}
