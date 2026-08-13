import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useCancelRequisition,
  useCreateRequisition,
  useIssueRequisition,
  useRequisitions,
  useReserveRequisition,
  type Requisition,
} from "@/api/requisitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormActions, FormField, FormGrid, FormInput, FormSelect } from "@/components/ui/form";
import { Panel } from "@/components/ui/panel";
import { TablePagination, TableToolbar } from "@/components/ui/table-toolbar";
import { useTableQuery } from "@/lib/table-query";
import { showSuccessToast } from "@/lib/toast";
import { formatDateTime } from "@/lib/utils";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["prbc", "ffp", "platelets", "whole_blood", "cryo"];
const REQ_STATUSES = [
  "pending",
  "partially_reserved",
  "fully_reserved",
  "issued",
  "cancelled",
];
const PRIORITIES = ["routine", "urgent", "emergency"];

const STATUS_COLORS: Record<string, string> = {
  pending: "border-warning/30 bg-warning/10 text-warning",
  partially_reserved: "border-primary/25 bg-primary/10 text-primary",
  fully_reserved: "border-primary/25 bg-primary/10 text-primary",
  issued: "border-success/30 bg-success/10 text-success",
  cancelled: "border-border bg-muted text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  routine: "",
  urgent: "border-warning/30 bg-warning/10 text-warning",
  emergency: "border-destructive/30 bg-destructive/10 text-destructive",
};

export default function RequisitionsPage() {
  const { user } = useAuth();
  const table = useTableQuery({ defaultOrderBy: "requested_at", defaultOrder: "desc", pageSize: 50 });
  const { data, isLoading } = useRequisitions({
    facility_id: user?.facility_id,
    page: table.page,
    page_size: table.pageSize,
    q: table.q || undefined,
    status: table.filters.status || undefined,
    blood_group: table.filters.blood_group || undefined,
    priority: table.filters.priority || undefined,
    order_by: table.orderBy,
    order: table.order,
  });
  const create = useCreateRequisition();
  const reserve = useReserveRequisition();
  const issue = useIssueRequisition();
  const cancel = useCancelRequisition();
  const [show, setShow] = useState(false);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await create.mutateAsync({
        facility_id: user?.facility_id || fd.get("facility_id"),
        patient_name: fd.get("patient_name"),
        patient_hospital_id: fd.get("patient_hospital_id"),
        blood_group: fd.get("blood_group"),
        component_type: fd.get("component_type"),
        units_requested: Number(fd.get("units_requested")),
        priority: fd.get("priority"),
        clinical_indication: fd.get("clinical_indication"),
      });
      showSuccessToast("Requisition created");
      setShow(false);
    } catch {
      /* errors toasted by api client */
    }
  }

  const columns = useMemo<DataTableColumn<Requisition>[]>(
    () => [
      {
        id: "patient_name",
        header: "Patient",
        sortable: true,
        cell: (r) => (
          <div>
            <div className="font-medium">{r.patient_name}</div>
            <div className="text-[11px] text-muted-foreground">{r.patient_hospital_id}</div>
          </div>
        ),
      },
      {
        id: "blood_group",
        header: "Need",
        sortable: true,
        cell: (r) => (
          <div>
            <div>
              {r.units_requested}× {r.component_type.replace(/_/g, " ")}
            </div>
            <div className="text-[11px] text-muted-foreground">{r.blood_group}</div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        cell: (r) => (
          <span className="inline-flex flex-wrap gap-1">
            <Badge className={STATUS_COLORS[r.status] ?? ""}>
              {r.status.replace(/_/g, " ")}
            </Badge>
            <Badge className={PRIORITY_COLORS[r.priority] ?? ""}>{r.priority}</Badge>
          </span>
        ),
      },
      {
        id: "requested_at",
        header: "Requested",
        sortable: true,
        cell: (r) => (
          <span className="text-[11px] text-muted-foreground">{formatDateTime(r.requested_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.status === "pending" && (
              <Button
                size="sm"
                onClick={() =>
                  reserve.mutate(r.id, {
                    onSuccess: () => showSuccessToast("Reserved"),
                  })
                }
              >
                Reserve
              </Button>
            )}
            {(r.status === "fully_reserved" || r.status === "partially_reserved") && (
              <Button
                size="sm"
                onClick={() =>
                  issue.mutate(r.id, {
                    onSuccess: () => showSuccessToast("Issued"),
                  })
                }
              >
                Issue
              </Button>
            )}
            {r.status !== "cancelled" && r.status !== "issued" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  cancel.mutate(r.id, {
                    onSuccess: () => showSuccessToast("Cancelled"),
                  })
                }
              >
                Cancel
              </Button>
            )}
          </div>
        ),
      },
    ],
    [reserve, issue, cancel]
  );

  return (
    <div className="space-y-4">
      {show && (
        <Panel title="Create requisition">
          <form onSubmit={onCreate} className="space-y-4">
            <FormGrid>
              {!user?.facility_id && (
                <FormField label="Facility ID" htmlFor="facility_id" required className="sm:col-span-2">
                  <FormInput id="facility_id" name="facility_id" required />
                </FormField>
              )}
              <FormField label="Patient name" htmlFor="patient_name" required>
                <FormInput id="patient_name" name="patient_name" required />
              </FormField>
              <FormField label="Hospital ID" htmlFor="patient_hospital_id" required>
                <FormInput id="patient_hospital_id" name="patient_hospital_id" required />
              </FormField>
              <FormField label="Blood group" htmlFor="blood_group" required>
                <FormSelect id="blood_group" name="blood_group">
                  {GROUPS.map((g) => <option key={g}>{g}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Component" htmlFor="component_type" required>
                <FormSelect id="component_type" name="component_type">
                  {COMPONENTS.map((c) => <option key={c}>{c}</option>)}
                </FormSelect>
              </FormField>
              <FormField label="Units" htmlFor="units_requested" required>
                <FormInput id="units_requested" name="units_requested" type="number" defaultValue={1} min={1} required />
              </FormField>
              <FormField label="Priority" htmlFor="priority">
                <FormSelect id="priority" name="priority">
                  <option value="routine">routine</option>
                  <option value="urgent">urgent</option>
                  <option value="emergency">emergency</option>
                </FormSelect>
              </FormField>
              <FormField label="Clinical indication" htmlFor="clinical_indication" required className="sm:col-span-2">
                <FormInput id="clinical_indication" name="clinical_indication" required />
              </FormField>
            </FormGrid>
            <FormActions flush>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShow(false)}>Cancel</Button>
            </FormActions>
          </form>
        </Panel>
      )}

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No requisitions match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search patient or hospital ID…"
            filters={[
              {
                key: "status",
                label: "All statuses",
                options: REQ_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
              },
              {
                key: "blood_group",
                label: "All groups",
                options: GROUPS.map((g) => ({ value: g, label: g })),
              },
              {
                key: "priority",
                label: "All priorities",
                options: PRIORITIES.map((p) => ({ value: p, label: p })),
              },
            ]}
            filterValues={table.filters}
            onFilterChange={table.setFilter}
          >
            <Button size="sm" onClick={() => setShow((v) => !v)}>
              {show ? "Close form" : "New requisition"}
            </Button>
          </TableToolbar>
        }
        footer={
          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={data?.total ?? 0}
            onPageChange={table.setPage}
          />
        }
      />
    </div>
  );
}
