import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useCancelRequisition,
  useCreateRequisition,
  useIssueRequisition,
  useRequisitions,
  useReserveRequisition,
} from "@/api/requisitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormActions, FormField, FormGrid, FormInput, FormSelect } from "@/components/ui/form";
import { PageHeader, Panel } from "@/components/ui/panel";
import { showSuccessToast } from "@/lib/toast";
import { formatDateTime } from "@/lib/utils";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["prbc", "ffp", "platelets", "whole_blood", "cryo"];

type ReqRow = {
  id: string;
  patient_name: string;
  patient_hospital_id: string;
  units_requested: number;
  component_type: string;
  blood_group: string;
  status: string;
  priority: string;
  requested_at: string;
};

export default function RequisitionsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useRequisitions(user?.facility_id);
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

  const columns = useMemo<DataTableColumn<ReqRow>[]>(
    () => [
      {
        id: "patient",
        header: "Patient",
        cell: (r) => (
          <div>
            <div className="font-medium">{r.patient_name}</div>
            <div className="text-[11px] text-slate-500">{r.patient_hospital_id}</div>
          </div>
        ),
      },
      {
        id: "need",
        header: "Need",
        cell: (r) => `${r.units_requested}× ${r.component_type} (${r.blood_group})`,
      },
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <span className="inline-flex flex-wrap gap-1">
            <Badge>{r.status}</Badge>
            <Badge>{r.priority}</Badge>
          </span>
        ),
      },
      {
        id: "requested",
        header: "Requested",
        cell: (r) => <span className="text-slate-600">{formatDateTime(r.requested_at)}</span>,
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
    <div className="space-y-3">
      <PageHeader
        title="Requisitions"
        description="Request, FEFO reserve, and issue components."
        actions={
          <Button onClick={() => setShow((v) => !v)}>
            {show ? "Close form" : "New requisition"}
          </Button>
        }
      />

      {show && (
        <Panel title="Create requisition">
          <form onSubmit={onCreate} className="space-y-3">
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
            <FormActions>
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
        rows={(data?.items ?? []) as ReqRow[]}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No requisitions yet."
      />
    </div>
  );
}
