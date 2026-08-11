import { useMemo, useState } from "react";
import { useOrganizerDirectory, type OrganizerDirectoryItem } from "@/api/admin";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  "",
  "community_society",
  "social_org",
  "police_paramilitary",
  "govt_union",
  "educational",
  "industrial",
  "political",
  "departmental_officer",
  "other",
];

export default function OrganizerDirectoryPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const { data, isLoading } = useOrganizerDirectory({
    q: q || undefined,
    category: category || undefined,
  });

  const columns = useMemo<DataTableColumn<OrganizerDirectoryItem>[]>(
    () => [
      {
        id: "serial",
        header: "#",
        className: "w-16",
        cell: (r) => <span className="text-xs text-gray-500">{r.source_serial ?? "—"}</span>,
      },
      {
        id: "org",
        header: "Organization",
        cell: (r) => (
          <div>
            <div className="font-medium text-gray-900">{r.org_name}</div>
            <div className="text-xs text-gray-500">{r.contact_role || "—"}</div>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: (r) => <span className="text-xs capitalize text-gray-600">{r.category.replace(/_/g, " ")}</span>,
      },
      {
        id: "location",
        header: "Location",
        cell: (r) => r.location || "—",
      },
      {
        id: "mobile",
        header: "Mobile",
        cell: (r) => <span className="font-mono text-sm">{r.mobile || "—"}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outreach directory</h1>
        <p className="text-sm text-gray-500">
          Red Cross Durg contact list for camp outreach — no login accounts required.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No directory contacts match this filter."
        toolbar={
          <>
            <Input
              placeholder="Search name or mobile…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs bg-white"
            />
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm capitalize"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c || "all"} value={c}>
                  {c ? c.replace(/_/g, " ") : "All categories"}
                </option>
              ))}
            </select>
          </>
        }
        footer={<p className="text-xs text-gray-500">{data?.total ?? 0} contacts</p>}
      />
    </div>
  );
}
