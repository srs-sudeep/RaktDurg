import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  Droplets,
  Radio,
  Tent,
  BookUser,
} from "lucide-react";
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
  if (count === 0) return <span className="font-display text-lg font-bold tabular-nums text-red-600">0</span>;
  if (count <= 2)
    return <span className="font-display text-lg font-bold tabular-nums text-amber-600">{count}</span>;
  return <span className="font-display text-lg font-bold tabular-nums text-emerald-700">{count}</span>;
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
  to,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "slate" | "red" | "amber" | "emerald" | "sky";
  to?: string;
}) {
  const tones = {
    slate: "from-slate-700 to-slate-900 text-slate-100",
    red: "from-red-600 to-rose-700 text-red-50",
    amber: "from-amber-500 to-orange-600 text-amber-50",
    emerald: "from-emerald-600 to-teal-700 text-emerald-50",
    sky: "from-sky-600 to-cyan-700 text-sky-50",
  };

  const body = (
    <div className="surface-card group relative transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/90">
      <div className="flex items-start gap-3 px-3.5 py-3.5">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
            tones[tone]
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
          <div className="font-display mt-0.5 text-[26px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
            {value}
          </div>
          {hint ? <div className="mt-1.5 text-[11.5px] text-slate-400">{hint}</div> : null}
        </div>
      </div>
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r opacity-90",
          tone === "red" && "from-red-500 to-rose-400",
          tone === "amber" && "from-amber-400 to-orange-400",
          tone === "emerald" && "from-emerald-400 to-teal-400",
          tone === "sky" && "from-sky-400 to-cyan-400",
          tone === "slate" && "from-slate-400 to-slate-300"
        )}
      />
    </div>
  );

  return to ? (
    <Link to={to} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">
      {body}
    </Link>
  ) : (
    body
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
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[15px] font-semibold text-slate-800">Live blood stock</h2>
            {sseEntries ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                <Radio className="h-3 w-3" /> Snapshot
              </span>
            )}
          </div>
          {data ? (
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Updated {formatDateTime(data.as_of)} · {totalAvailable} available components
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
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          Failed to load stock data.
        </p>
      )}

      {displayEntries.length > 0 &&
        Object.entries(groupedByType).map(([compType, bgMap]) => (
          <Panel
            key={compType}
            title={COMPONENT_LABELS[compType] ?? compType}
            description="Available units by blood group"
            bodyClassName="p-2.5"
          >
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {bloodGroups.map((bg) => {
                const count = bgMap[bg] ?? 0;
                return (
                  <div
                    key={bg}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition",
                      count === 0
                        ? "border-red-100 bg-gradient-to-b from-red-50 to-white"
                        : count <= 2
                          ? "border-amber-100 bg-gradient-to-b from-amber-50/80 to-white"
                          : "border-slate-100 bg-gradient-to-b from-slate-50 to-white hover:border-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide",
                        bloodGroupColor(bg)
                      )}
                    >
                      {bg}
                    </span>
                    <StockBadge count={count} />
                  </div>
                );
              })}
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
    <div className="space-y-5">
      <PageHeader
        title={`${ROLE_LABELS[role]} overview`}
        description="Operations snapshot for this facility — stock, queues, and camps."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Blood units"
          value={units?.total ?? units?.items?.length ?? "—"}
          hint="Facility inventory"
          icon={Droplets}
          tone="red"
          to="/units"
        />
        <Kpi
          label="Open requisitions"
          value={pendingReqs}
          hint="Pending / partial"
          icon={ClipboardList}
          tone="amber"
          to="/requisitions"
        />
        <Kpi
          label="Camps to review"
          value={pendingCamps}
          hint="Submitted / under review"
          icon={Tent}
          tone="sky"
          to="/camps/approval"
        />
        <Kpi
          label={role === "superadmin" ? "Organizer accounts" : "Booking queue"}
          value={role === "superadmin" ? organizers?.total ?? "—" : bookings?.length ?? "—"}
          hint={role === "superadmin" ? "Login-linked organizers" : "Requested slots"}
          icon={role === "superadmin" ? Building2 : BookUser}
          tone="emerald"
          to={role === "superadmin" ? "/organizers" : "/camps/bookings"}
        />
      </div>
      {!facilityId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
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
    <div className="space-y-5">
      <PageHeader
        title="Organizer overview"
        description="Your camp applications and upcoming events."
        actions={
          <Link to="/camps/apply">
            <Button size="sm">New application</Button>
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total camps" value={items.length} icon={Tent} tone="slate" to="/camps" />
        <Kpi label="Approved" value={byStatus.approved ?? 0} icon={Droplets} tone="emerald" />
        <Kpi
          label="Pending review"
          value={(byStatus.submitted ?? 0) + (byStatus.under_review ?? 0)}
          icon={ClipboardList}
          tone="amber"
        />
        <Kpi label="Completed" value={byStatus.completed ?? 0} icon={Building2} tone="sky" />
      </div>
      <Panel title="Recent camps" description="Latest applications and their status">
        {isLoading ? (
          <p className="text-[13px] text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-[13px] text-slate-500">No camps yet. Submit an application to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.slice(0, 8).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                <div>
                  <div className="font-medium text-slate-900">{c.camp_name}</div>
                  <div className="text-[11.5px] text-slate-500">
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
