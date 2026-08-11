import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useCampCoupons, type CampCoupon } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/panel";

export default function CampCouponsPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useCampCoupons(id);

  const columns = useMemo<DataTableColumn<CampCoupon>[]>(
    () => [
      {
        id: "code",
        header: "Coupon",
        cell: (c) => <span className="font-mono text-[12px]">{c.coupon_code}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: (c) => (
          <Badge className={c.is_used ? "" : "border-emerald-300 bg-emerald-50 text-emerald-900"}>
            {c.is_used ? "used" : "available"}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Camp coupons"
        description="Issued coupon codes for this camp."
        actions={
          <Link to="/camps" className="text-[13px] text-red-700 hover:underline">
            ← Camps
          </Link>
        }
      />
      {error && <p className="text-[13px] text-red-600">Could not load coupons.</p>}
      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No coupons for this camp."
      />
    </div>
  );
}
