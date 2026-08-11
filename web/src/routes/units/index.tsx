import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useScanBarcode, useUnits } from "@/api/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bloodGroupColor, cn, formatDateTime } from "@/lib/utils";

export default function UnitsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useUnits(user?.facility_id);
  const scan = useScanBarcode();
  const [barcode, setBarcode] = useState("");

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

      {isLoading && <p className="text-gray-500">Loading units…</p>}
      {error && <p className="text-red-600">Failed to load units.</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Barcode</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/units/${u.id}`} className="font-medium text-red-700 hover:underline">
                    {u.barcode}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", bloodGroupColor(u.blood_group))}>
                    {u.blood_group}
                  </span>
                </td>
                <td className="px-4 py-3"><Badge>{u.lifecycle_state}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{formatDateTime(u.expiry_datetime)}</td>
              </tr>
            ))}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No units yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
