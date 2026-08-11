import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCamps, useReviewCamp, type Camp } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

export default function CampApprovalPage() {
  const { data, isLoading } = useCamps("pending");
  const review = useReviewCamp();

  const columns = useMemo<DataTableColumn<Camp>[]>(
    () => [
      {
        id: "name",
        header: "Camp",
        cell: (c) => (
          <div>
            <div className="font-medium text-slate-900">{c.camp_name}</div>
            <div className="text-[11px] text-slate-500">
              {c.requested_date} · {c.location}
            </div>
          </div>
        ),
      },
      { id: "status", header: "Status", cell: (c) => <Badge>{c.status}</Badge> },
      {
        id: "actions",
        header: "Actions",
        cell: (c) => (
          <div className="flex gap-1">
            <Button
              size="sm"
              disabled={review.isPending}
              onClick={() =>
                review.mutate(
                  { id: c.id, action: "approve", coupon_prefix: "RD" },
                  {
                    onSuccess: () => showSuccessToast("Camp approved", c.camp_name),
                  }
                )
              }
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={review.isPending}
              onClick={() =>
                review.mutate(
                  { id: c.id, action: "reject", rejection_reason: "Capacity" },
                  {
                    onSuccess: () => showSuccessToast("Camp rejected", c.camp_name),
                  }
                )
              }
            >
              Reject
            </Button>
          </div>
        ),
      },
    ],
    [review]
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Camp approval queue"
        description="Pending applications waiting for doctor / admin review."
        actions={
          <Link to="/camps" className="text-[13px] text-red-700 hover:underline">
            ← All camps
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No pending camps."
      />
    </div>
  );
}
