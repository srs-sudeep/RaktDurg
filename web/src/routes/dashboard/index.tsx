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
import { ROLE_LABELS, type UserRole } from "@/lib/rbac";
import { bloodGroupColor, cn, formatDateTime } from "@/lib/utils";

const COMPONENT_LABELS: Record<string, string> = {
  whole_blood: "Whole Blood",
  prbc: "PRBC",
  platelets: "Platelets",
  ffp: "FFP",
  cryo: "Cryo",
  granulocytes: "Granulocytes",
};

function StockBadge({ count }: { count: number }) {
  if (count === 0) return <span className="font-semibold text-red-600">0</span>;
  if (count <= 2) return <span className="font-semibold text-orange-600">{count}</span>;
  return <span className="font-semibold text-emerald-700">{count}</span>;
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-slate-200 bg-white px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">{value}</div>
      {hint ? <div className="text-[11px] text-slate-400">{hint}</div> : null}
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
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const totalAvailable = displayEntries.reduce((sum, e) => sum + e.available_count, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-800">Live blood stock</h2>
          {data ? (
            <p className="text-[12px] text-slate-500">
              Updated {formatDateTime(data.as_of)}
              {sseEntries ? " · live" : ""} · {totalAvailable} available components
            </p>
          ) : null}
        </div>
        <Link to="/units">
          <Button size="sm" variant="outline">
            Open units
          </Button>
        </Link>
      </div>

      {isLoading && !sseEntries && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
        </div>
      )}
      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          Failed to load stock data.
        </p>
      )}

      {displayEntries.length > 0 &&
        Object.entries(groupedByType).map(([compType, bgMap]) => (
          <Panel key={compType} title={COMPONENT_LABELS[compType] ?? compType} bodyClassName="p-0">
            <div className="grid grid-cols-4 sm:grid-cols-8">
              {bloodGroups.map((bg) => (
                <div
                  key={bg}
                  className={cn(
                    "flex flex-col items-center gap-1 border-r border-b border-slate-100 px-2 py-3 last:border-r-0",
                    (bgMap[bg] ?? 0) === 0 && "bg-red-50/60"
                  )}
                >
                  <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", bloodGroupColor(bg))}>
                    {bg}
                  </span>
                  <StockBadge count={bgMap[bg] ?? 0} />
                </div>
              ))}
            </div>
          </Panel>
        ))}
    </div>
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
      <PageHeader
        title={`${ROLE_LABELS[role]} dashboard`}
        description="Operations snapshot for this facility."
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Blood units" value={units?.total ?? units?.items?.length ?? "—"} hint="Facility inventory" />
        <Kpi label="Open requisitions" value={pendingReqs} hint="Pending / partial" />
        <Kpi label="Camps to review" value={pendingCamps} hint="Submitted / under review" />
        <Kpi
          label={role === "superadmin" ? "Organizer accounts" : "Booking queue"}
          value={role === "superadmin" ? organizers?.total ?? "—" : bookings?.length ?? "—"}
          hint={role === "superadmin" ? "Login-linked organizers" : "Requested slots"}
        />
      </div>
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
        title="Organizer dashboard"
        description="Your camp applications and upcoming events."
        actions={
          <Link to="/camps/apply">
            <Button size="sm">New application</Button>
          </Link>
        }
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total camps" value={items.length} />
        <Kpi label="Approved" value={byStatus.approved ?? 0} />
        <Kpi label="Pending review" value={(byStatus.submitted ?? 0) + (byStatus.under_review ?? 0)} />
        <Kpi label="Completed" value={byStatus.completed ?? 0} />
      </div>
      <Panel title="Recent camps">
        {isLoading ? (
          <p className="text-[13px] text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-[13px] text-slate-500">No camps yet. Submit an application to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.slice(0, 8).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
                <div>
                  <div className="font-medium text-slate-900">{c.camp_name}</div>
                  <div className="text-[11px] text-slate-500">
                    {c.requested_date} · {c.location}
                  </div>
                </div>
                <Badge>{c.status}</Badge>
              </li>
            ))}
          </ul>
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
        <PageHeader title="Citizen dashboard" description="Use the citizen portal for wallet and bookings." />
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
