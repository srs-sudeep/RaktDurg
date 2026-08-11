import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useScanBarcode, useUnits } from "@/api/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
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
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", bloodGroupColor(u.blood_group))}>
            {u.blood_group}
          </span>
        ),
      },
      { id: "state", header: "State", cell: (u) => <Badge>{u.lifecycle_state}</Badge> },
      {
        id: "expiry",
        header: "Expiry",
        cell: (u) => <span className="text-gray-600">{formatDateTime(u.expiry_datetime)}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blood Units</h1>
          <p className="text-sm text-gray-500">Scan barcodes or browse facility inventory.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (barcode.trim()) scan.mutate(barcode.trim());
          }}
        >
          <Input
            placeholder="Scan barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-56"
          />
          <Button type="submit" disabled={scan.isPending}>Lookup</Button>
        </form>
      </div>

      {scan.data && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          Found unit{" "}
          <Link className="font-semibold text-red-700 underline" to={`/units/${scan.data.unit.id}`}>
            {scan.data.unit.barcode}
          </Link>{" "}
          — {scan.data.unit.blood_group} / {scan.data.unit.lifecycle_state}
        </div>
      )}
      {scan.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Barcode not found.
        </div>
      )}
      {error && <p className="text-red-600">Failed to load units.</p>}

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
