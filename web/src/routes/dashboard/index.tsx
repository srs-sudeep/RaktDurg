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
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { type UserRole } from "@/lib/rbac";
import { cn, formatDateTime } from "@/lib/utils";

const CAMP_STATUS_COLORS: Record<string, string> = {
  approved: "border-success/30 bg-success/10 text-success",
  completed: "border-success/30 bg-success/10 text-success",
  submitted: "border-primary/25 bg-primary/10 text-primary",
  under_review: "border-warning/30 bg-warning/10 text-warning",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-muted text-muted-foreground",
};

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
      cell: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25",
      label: "Empty",
    };
  }
  if (n <= 2) {
    return {
      cell: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/30",
      label: "Low",
    };
  }
  return {
    cell: "bg-success/10 text-foreground ring-1 ring-inset ring-success/25",
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
              <div className="text-[12px] font-medium text-muted-foreground">{item.label}</div>
              {item.to ? <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
            </div>
            <div className="mt-2 text-[28px] font-semibold tabular-nums leading-none tracking-tight text-foreground">
              {item.value}
            </div>
          </div>
        );
        return item.to ? (
          <Link key={item.label} to={item.to} className="block hover:[&_.surface-card]:border-primary/40">
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
              live ? "bg-success/10 text-success ring-1 ring-success/30" : "bg-muted text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                live ? "animate-pulse bg-success" : "bg-muted-foreground"
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
        <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">Loading stock…</p>
      )}
      {error && (
        <p className="border-t border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          Failed to load stock data.
        </p>
      )}
      {!isLoading && !error && rows.length === 0 && (
        <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">No stock rows yet.</p>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto p-3 sm:p-4">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] bg-card px-2 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Component
                </th>
                {BLOOD_GROUPS.map((bg) => (
                  <th
                    key={bg}
                    className="px-1.5 pb-2 text-center text-[11px] font-semibold tracking-wide text-muted-foreground"
                  >
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md bg-muted px-2 py-1 text-foreground">
                      {bg}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([compType, bgMap]) => (
                <tr key={compType}>
                  <td className="sticky left-0 z-[1] bg-card px-2 py-1">
                    <div className="rounded-lg bg-card px-3 py-2.5 font-medium text-foreground ring-1 ring-border">
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
          <div className="mt-3 flex flex-wrap gap-3 px-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-destructive/20 ring-1 ring-destructive/30" /> Empty
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-warning/20 ring-1 ring-warning/30" /> Low (≤2)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-success/20 ring-1 ring-success/30" /> Available
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
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-[13px] text-warning">
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

  const recentColumns = useMemo<DataTableColumn<(typeof items)[number]>[]>(
    () => [
      {
        id: "camp_name",
        header: "Camp",
        cell: (c) => (
          <div>
            <div className="font-medium text-foreground">{c.camp_name}</div>
            <div className="text-[11px] text-muted-foreground">{c.location}</div>
          </div>
        ),
      },
      {
        id: "requested_date",
        header: "Date",
        cell: (c) => <span className="text-muted-foreground">{c.requested_date}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: (c) => (
          <Badge className={CAMP_STATUS_COLORS[c.status] ?? ""}>
            {c.status.replace(/_/g, " ")}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
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
      <DataTable
        columns={recentColumns}
        rows={items.slice(0, 8)}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No camps yet."
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-sans text-[14px] font-semibold tracking-tight text-foreground">
              Recent camps
            </h2>
            <Link to="/camps/apply">
              <Button size="sm">New application</Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "doctor") as UserRole;

  if (role === "organizer") return <OrganizerDashboard />;
  if (role === "citizen") {
    return (
      <div className="space-y-4">
        <Panel>
          <Link to="/my-account" className="text-[13px] text-primary hover:underline">
            Open my account →
          </Link>
        </Panel>
      </div>
    );
  }
  return <StaffOpsDashboard role={role} />;
}
