import { useMemo, useState } from "react";
import { useOrganizerDirectory, type OrganizerDirectoryItem } from "@/api/admin";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormSelect } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/panel";

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
        className: "w-14",
        cell: (r) => <span className="text-[11px] text-slate-500">{r.source_serial ?? "—"}</span>,
      },
      {
        id: "org",
        header: "Organization",
        cell: (r) => (
          <div>
            <div className="font-medium text-slate-900">{r.org_name}</div>
            <div className="text-[11px] text-slate-500">{r.contact_role || "—"}</div>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: (r) => <span className="text-[11px] capitalize text-slate-600">{r.category.replace(/_/g, " ")}</span>,
      },
      { id: "location", header: "Location", cell: (r) => r.location || "—" },
      {
        id: "mobile",
        header: "Mobile",
        cell: (r) => <span className="font-mono text-[12px]">{r.mobile || "—"}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Outreach directory"
        description="Red Cross Durg contact list for camp outreach."
      />
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
              className="max-w-xs"
            />
            <FormSelect className="w-52 capitalize" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c || "all"} value={c}>
                  {c ? c.replace(/_/g, " ") : "All categories"}
                </option>
              ))}
            </FormSelect>
          </>
        }
        footer={<p className="text-[11px] text-slate-500">{data?.total ?? 0} contacts</p>}
      />
    </div>
  );
}
