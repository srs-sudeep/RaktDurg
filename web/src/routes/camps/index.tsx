import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useApplyCamp, useCamps, useReviewCamp } from "@/api/camps";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CampsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useCamps();
  const apply = useApplyCamp();
  const review = useReviewCamp();
  const [showApply, setShowApply] = useState(false);
  const canApprove = user?.role === "superadmin" || user?.role === "doctor";
  const canApply = user?.role === "organizer" || user?.role === "superadmin";

  async function onApply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apply.mutateAsync({
      host_facility_id: user?.facility_id || fd.get("host_facility_id"),
      camp_name: fd.get("camp_name"),
      requested_date: fd.get("requested_date"),
      location: fd.get("location"),
      expected_donors: Number(fd.get("expected_donors")),
    });
    setShowApply(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Camps</h1>
          <p className="text-sm text-gray-500">Applications, approvals, and coupons.</p>
        </div>
        <div className="flex gap-2">
          {canApprove && <Link to="/camps/approval"><Button variant="outline">Approval queue</Button></Link>}
          {canApply && <Button onClick={() => setShowApply((v) => !v)}>{showApply ? "Cancel" : "Apply"}</Button>}
        </div>
      </div>

      {showApply && (
        <form onSubmit={onApply} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
          {!user?.facility_id && (
            <div className="sm:col-span-2"><Label>Host facility ID</Label><Input name="host_facility_id" required /></div>
          )}
          <div><Label>Camp name</Label><Input name="camp_name" required /></div>
          <div><Label>Date</Label><Input name="requested_date" type="date" required /></div>
          <div className="sm:col-span-2"><Label>Location</Label><Input name="location" required /></div>
          <div><Label>Expected donors</Label><Input name="expected_donors" type="number" defaultValue={40} required /></div>
          <div className="flex items-end"><Button type="submit" disabled={apply.isPending}>Submit</Button></div>
        </form>
      )}

      {isLoading ? <p>Loading…</p> : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/camps/${c.id}/coupons`} className="font-medium text-red-700 hover:underline">{c.camp_name}</Link>
                    <div className="text-xs text-gray-500">{c.location}</div>
                  </td>
                  <td className="px-4 py-3">{c.requested_date}</td>
                  <td className="px-4 py-3"><Badge>{c.status}</Badge></td>
                  <td className="px-4 py-3">
                    {canApprove && c.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => review.mutate({ id: c.id, action: "approve", coupon_prefix: "RD" })}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => review.mutate({ id: c.id, action: "reject", rejection_reason: "Not feasible" })}>Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
