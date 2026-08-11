import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function countClass(n: number) {
  if (n === 0) return "text-red-700 font-semibold";
  if (n <= 2) return "text-amber-700 font-semibold";
  return "text-slate-900 font-semibold";
}

function KpiStrip({
  items,
}: {
  items: { label: string; value: string | number; to?: string }[];
}) {
  return (
    <div className="surface-card grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => {
        const inner = (
          <div className="px-3 py-2.5">
            <div className="text-[11px] text-slate-500">{item.label}</div>
            <div className="mt-0.5 text-[22px] font-semibold tabular-nums leading-none text-slate-900">
              {item.value}
            </div>
          </div>
        );
        return item.to ? (
          <Link key={item.label} to={item.to} className="hover:bg-slate-50">
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

  return (
    <Panel
      title="Live blood stock"
      description={
        data
          ? `${formatDateTime(data.as_of)}${sseEntries ? " · live" : ""} · ${totalAvailable} available`
          : undefined
      }
      actions={
        <Link to="/units">
          <Button size="sm" variant="outline">
            Units
          </Button>
        </Link>
      }
      bodyClassName="p-0"
    >
      {isLoading && !sseEntries && (
        <p className="px-3 py-6 text-center text-[13px] text-slate-500">Loading stock…</p>
      )}
      {error && (
        <p className="border-t border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          Failed to load stock data.
        </p>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Component</th>
                {BLOOD_GROUPS.map((bg) => (
                  <th key={bg} className="px-2 py-2 text-center">
                    {bg}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([compType, bgMap]) => (
                <tr key={compType} className="border-b border-slate-200 last:border-0">
                  <td className="px-3 py-1.5 font-medium text-slate-800">
                    {COMPONENT_LABELS[compType] ?? compType}
                  </td>
                  {BLOOD_GROUPS.map((bg) => {
                    const n = bgMap[bg] ?? 0;
                    return (
                      <td
                        key={bg}
                        className={cn(
                          "px-2 py-1.5 text-center tabular-nums",
                          n === 0 && "bg-red-50/80",
                          countClass(n)
                        )}
                      >
                        {n}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="space-y-3">
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
        <p className="border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
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
    <div className="space-y-3">
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
          <p className="px-3 py-4 text-[13px] text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-slate-500">No camps yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-left text-[11px] font-semibold uppercase text-slate-600">
                <th className="px-3 py-2">Camp</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 8).map((c) => (
                <tr key={c.id} className="border-b border-slate-200 last:border-0">
                  <td className="px-3 py-1.5">
                    <div className="font-medium text-slate-900">{c.camp_name}</div>
                    <div className="text-[11px] text-slate-500">{c.location}</div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">{c.requested_date}</td>
                  <td className="px-3 py-1.5">
                    <Badge>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
