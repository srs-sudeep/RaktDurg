import { Link, useParams } from "react-router-dom";
import { useCampCoupons } from "@/api/camps";
import { Badge } from "@/components/ui/badge";

export default function CampCouponsPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useCampCoupons(id);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/camps" className="text-sm text-red-600 hover:underline">← Camps</Link>
        <h1 className="mt-2 text-2xl font-bold">Camp coupons</h1>
      </div>
      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">Could not load coupons.</p>}
      <ul className="space-y-2">
        {(data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm">
            <span className="font-mono">{c.coupon_code}</span>
            <Badge className={c.is_used ? "bg-gray-200" : "bg-green-100 text-green-800"}>
              {c.is_used ? "used" : "available"}
            </Badge>
          </li>
        ))}
        {!isLoading && (data?.length ?? 0) === 0 && <p className="text-gray-500">No coupons for this camp.</p>}
      </ul>
    </div>
  );
}
