import { Link } from "react-router-dom";
import { useCamps, useReviewCamp } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CampApprovalPage() {
  const { data, isLoading } = useCamps("pending");
  const review = useReviewCamp();

  return (
    <div className="space-y-6">
      <div>
        <Link to="/camps" className="text-sm text-red-600 hover:underline">← Camps</Link>
        <h1 className="mt-2 text-2xl font-bold">Camp approval queue</h1>
      </div>
      {isLoading ? <p>Loading…</p> : (
        <div className="space-y-3">
          {(data?.items ?? []).map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
              <div>
                <div className="font-semibold">{c.camp_name}</div>
                <div className="text-sm text-gray-500">{c.requested_date} · {c.location}</div>
                <Badge className="mt-1">{c.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => review.mutate({ id: c.id, action: "approve", coupon_prefix: "RD" })}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => review.mutate({ id: c.id, action: "reject", rejection_reason: "Capacity" })}>Reject</Button>
              </div>
            </div>
          ))}
          {(data?.items?.length ?? 0) === 0 && <p className="text-gray-500">No pending camps.</p>}
        </div>
      )}
    </div>
  );
}
