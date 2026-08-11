import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCamps, useReviewCamp, type Camp } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";

const PENDING = new Set(["submitted", "under_review"]);

export default function CampApprovalPage() {
  const { data, isLoading } = useCamps();
  const review = useReviewCamp();

  const rows = useMemo(
    () => (data?.items ?? []).filter((c) => PENDING.has(c.status)),
    [data]
  );

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
      {
        id: "status",
        header: "Status",
        cell: (c) => (
          <Badge
            className={
              c.status === "under_review"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-sky-300 bg-sky-50 text-sky-900"
            }
          >
            {c.status.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (c) => (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              disabled={review.isPending}
              onClick={() =>
                review.mutate(
                  { id: c.id, action: "approve", coupon_prefix: "RD" },
                  { onSuccess: () => showSuccessToast("Camp approved", c.camp_name) }
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
                  { onSuccess: () => showSuccessToast("Camp rejected", c.camp_name) }
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
        actions={
          <Link to="/camps">
            <Button variant="outline" size="sm">
              All camps
            </Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No camps awaiting approval."
        footer={<p className="text-[11px] text-slate-500">{rows.length} in queue</p>}
      />
    </div>
  );
}
