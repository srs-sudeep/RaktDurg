import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useCampCoupons, type CampCoupon } from "@/api/camps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { TableToolbar } from "@/components/ui/table-toolbar";

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
          <Badge className={c.is_used ? "" : "border-success/30 bg-success/10 text-success"}>
            {c.is_used ? "used" : "available"}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {error && <p className="text-[13px] text-destructive">Could not load coupons.</p>}
      <DataTable
        columns={columns}
        rows={data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No coupons for this camp."
        toolbar={
          <TableToolbar>
            <Link to="/camps">
              <Button variant="outline" size="sm">
                ← Camps
              </Button>
            </Link>
          </TableToolbar>
        }
      />
    </div>
  );
}
