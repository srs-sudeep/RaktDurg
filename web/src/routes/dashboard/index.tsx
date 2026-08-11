import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCamps, useCampBookings } from "@/api/camps";
import { useRequisitions } from "@/api/requisitions";
import { useAuthenticatedStock, type StockEntry } from "@/api/stock";
import { useUnits } from "@/api/units";
import { useOrganizerAccounts } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/panel";
import { type UserRole } from "@/lib/rbac";
import { cn, formatDateTime } from "@/lib/utils";

const COMPONENT_LABELS: Record<string, string> = {
  whole_blood: "Whole Blood",
  prbc: "PRBC",
  platelets: "Platelets",
  ffp: "FFP",
  cryo: "Cryo",
  granulocytes: "Granulocytes",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function stockTone(n: number) {
  if (n === 0) {
    return {
      cell: "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200/80",
      label: "Empty",
    };
  }
  if (n <= 2) {
    return {
      cell: "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200/80",
      label: "Low",
    };
  }
  return {
    cell: "bg-emerald-50/70 text-slate-900 ring-1 ring-inset ring-emerald-100",
    label: "OK",
  };
}

function KpiStrip({
  items,
}: {
  items: { label: string; value: string | number; to?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const inner = (
          <div className="surface-card h-full px-4 py-3.5 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[12px] font-medium text-slate-500">{item.label}</div>
              {item.to ? <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" /> : null}
            </div>
            <div className="mt-2 text-[28px] font-semibold tabular-nums leading-none tracking-tight text-slate-900">
              {item.value}
            </div>
          </div>
        );
        return item.to ? (
          <Link key={item.label} to={item.to} className="block hover:[&_.surface-card]:border-slate-400">
            {inner}
          </Link>
        ) : (
          <div key={item.label}>{inner}</div>
        );
      })}
    </div>
  );
}

function StockGrid({ facilityId }: { facilityId: string }) {
  const { data, isLoading, error } = useAuthenticatedStock(facilityId);
  const [sseEntries, setSseEntries] = useState<StockEntry[] | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";
    const url = `${apiBase}/stream/stock/${facilityId}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (Array.isArray(parsed.entries)) setSseEntries(parsed.entries);
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [facilityId]);

  const displayEntries = sseEntries ?? data?.entries ?? [];
  const groupedByType: Record<string, Record<string, number>> = {};
  for (const entry of displayEntries) {
    if (!groupedByType[entry.component_type]) groupedByType[entry.component_type] = {};
    groupedByType[entry.component_type][entry.blood_group] = entry.available_count;
  }
  const totalAvailable = displayEntries.reduce((sum, e) => sum + e.available_count, 0);
  const rows = Object.entries(groupedByType);
  const live = Boolean(sseEntries);

  return (
    <Panel
      title="Live blood stock"
      description={
        data
          ? `${formatDateTime(data.as_of)} · ${totalAvailable} units available`
          : undefined
      }
      actions={
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              live ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                live ? "animate-pulse bg-emerald-500" : "bg-slate-400"
              )}
            />
            {live ? "Live" : "Snapshot"}
          </span>
          <Link to="/units">
            <Button size="sm" variant="outline">
              View units
            </Button>
          </Link>
        </div>
      }
      bodyClassName="p-0"
    >
      {isLoading && !sseEntries && (
        <p className="px-4 py-8 text-center text-[13px] text-slate-500">Loading stock…</p>
      )}
      {error && (
        <p className="border-t border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Failed to load stock data.
        </p>
      )}
      {!isLoading && !error && rows.length === 0 && (
        <p className="px-4 py-8 text-center text-[13px] text-slate-500">No stock rows yet.</p>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto p-3 sm:p-4">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] bg-[#fafbfc] px-2 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Component
                </th>
                {BLOOD_GROUPS.map((bg) => (
                  <th
                    key={bg}
                    className="px-1.5 pb-2 text-center text-[11px] font-semibold tracking-wide text-slate-600"
                  >
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                      {bg}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([compType, bgMap]) => (
                <tr key={compType}>
                  <td className="sticky left-0 z-[1] bg-[#fafbfc] px-2 py-1">
                    <div className="rounded-lg bg-white px-3 py-2.5 font-medium text-slate-800 ring-1 ring-slate-200">
                      {COMPONENT_LABELS[compType] ?? compType}
                    </div>
                  </td>
                  {BLOOD_GROUPS.map((bg) => {
                    const n = bgMap[bg] ?? 0;
                    const tone = stockTone(n);
                    return (
                      <td key={bg} className="px-1.5 py-1">
                        <div
                          title={`${COMPONENT_LABELS[compType] ?? compType} ${bg}: ${n} (${tone.label})`}
                          className={cn(
                            "mx-auto flex h-11 w-full min-w-[2.75rem] max-w-[4.5rem] items-center justify-center rounded-lg text-[15px] font-semibold tabular-nums",
                            tone.cell
                          )}
                        >
                          {n}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-3 px-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-200" /> Empty
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-200" /> Low (≤2)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-100" /> Available
            </span>
          </div>
        </div>
      )}
    </Panel>
  );
}

function StaffOpsDashboard({ role }: { role: UserRole }) {
  const { user } = useAuth();
  const facilityId = user?.facility_id ?? "";
  const { data: units } = useUnits(facilityId || undefined);
  const { data: reqs } = useRequisitions(facilityId || undefined);
  const { data: camps } = useCamps();
  const { data: bookings } = useCampBookings("requested");
  const { data: organizers } = useOrganizerAccounts();

  const pendingReqs = useMemo(
    () => (reqs?.items ?? []).filter((r) => r.status === "pending" || r.status === "partially_reserved").length,
    [reqs]
  );
  const pendingCamps = useMemo(
    () =>
      (camps?.items ?? []).filter((c) => c.status === "submitted" || c.status === "under_review").length,
    [camps]
  );

  return (
    <div className="space-y-4">
      <KpiStrip
        items={[
          {
            label: "Blood units",
            value: units?.total ?? units?.items?.length ?? "—",
            to: "/units",
          },
          { label: "Open requisitions", value: pendingReqs, to: "/requisitions" },
          { label: "Camps to review", value: pendingCamps, to: "/camps/approval" },
          {
            label: role === "superadmin" ? "Organizer accounts" : "Booking queue",
            value: role === "superadmin" ? organizers?.total ?? "—" : bookings?.length ?? "—",
            to: role === "superadmin" ? "/organizers" : "/camps/bookings",
          },
        ]}
      />
      {!facilityId ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          No facility assigned on this account — stock grid unavailable.
        </p>
      ) : (
        <StockGrid facilityId={facilityId} />
      )}
    </div>
  );
}

function OrganizerDashboard() {
  const { data: camps, isLoading } = useCamps();
  const items = camps?.items ?? [];
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of items) map[c.status] = (map[c.status] ?? 0) + 1;
    return map;
  }, [items]);

  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <Link to="/camps/apply">
            <Button size="sm">New application</Button>
          </Link>
        }
      />
      <KpiStrip
        items={[
          { label: "Total camps", value: items.length, to: "/camps" },
          { label: "Approved", value: byStatus.approved ?? 0 },
          {
            label: "Pending review",
            value: (byStatus.submitted ?? 0) + (byStatus.under_review ?? 0),
          },
          { label: "Completed", value: byStatus.completed ?? 0 },
        ]}
      />
      <Panel title="Recent camps" bodyClassName="p-0">
        {isLoading ? (
          <p className="px-4 py-5 text-[13px] text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-5 text-[13px] text-slate-500">No camps yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-4 py-2.5">Camp</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-900">{c.camp_name}</div>
                      <div className="text-[11px] text-slate-500">{c.location}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{c.requested_date}</td>
                    <td className="px-4 py-2.5">
                      <Badge>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "doctor") as UserRole;

  if (role === "organizer") return <OrganizerDashboard />;
  if (role === "citizen") {
    return (
      <div className="space-y-3">
        <Panel>
          <Link to="/my-account" className="text-[13px] text-red-700 hover:underline">
            Open my account →
          </Link>
        </Panel>
      </div>
    );
  }
  return <StaffOpsDashboard role={role} />;
}
