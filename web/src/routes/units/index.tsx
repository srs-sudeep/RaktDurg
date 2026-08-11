import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useScanBarcode, useUnits } from "@/api/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";
import { bloodGroupColor, cn, formatDateTime } from "@/lib/utils";

type UnitRow = {
  id: string;
  barcode: string;
  blood_group: string;
  lifecycle_state: string;
  expiry_datetime: string;
};

export default function UnitsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useUnits(user?.facility_id);
  const scan = useScanBarcode();
  const [barcode, setBarcode] = useState("");
  const navigate = useNavigate();

  const columns = useMemo<DataTableColumn<UnitRow>[]>(
    () => [
      {
        id: "barcode",
        header: "Barcode",
        cell: (u) => (
          <Link to={`/units/${u.id}`} className="font-medium text-red-700 hover:underline">
            {u.barcode}
          </Link>
        ),
      },
      {
        id: "group",
        header: "Group",
        cell: (u) => (
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", bloodGroupColor(u.blood_group))}>
            {u.blood_group}
          </span>
        ),
      },
      { id: "state", header: "State", cell: (u) => <Badge>{u.lifecycle_state}</Badge> },
      {
        id: "expiry",
        header: "Expiry",
        cell: (u) => <span className="text-slate-600">{formatDateTime(u.expiry_datetime)}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Blood units"
        description="Scan barcodes or browse facility inventory."
        actions={
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!barcode.trim()) return;
              scan.mutate(barcode.trim(), {
                onSuccess: (res: { unit?: { barcode?: string; id?: string } }) => {
                  showSuccessToast("Unit found", res.unit?.barcode);
                  if (res.unit?.id) navigate(`/units/${res.unit.id}`);
                },
              });
            }}
          >
            <Input
              placeholder="Scan barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-52"
            />
            <Button type="submit" disabled={scan.isPending}>Lookup</Button>
          </form>
        }
      />

      {error && <p className="text-[13px] text-red-600">Failed to load units.</p>}

      <DataTable
        columns={columns}
        rows={(data?.items ?? []) as UnitRow[]}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        onRowClick={(u) => navigate(`/units/${u.id}`)}
        emptyMessage="No units yet."
      />
    </div>
  );
}
