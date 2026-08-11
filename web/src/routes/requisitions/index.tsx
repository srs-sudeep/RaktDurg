import { FormEvent, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["prbc", "ffp", "platelets", "whole_blood", "cryo"];

export default function RequisitionsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useRequisitions(user?.facility_id);
  const create = useCreateRequisition();
  const reserve = useReserveRequisition();
  const issue = useIssueRequisition();
  const cancel = useCancelRequisition();
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
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
      setShow(false);
    } catch (error: unknown) {
      setErr((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail?.toString() ?? "Create failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requisitions</h1>
          <p className="text-sm text-gray-500">Request, FEFO reserve, and issue components.</p>
        </div>
        <Button onClick={() => setShow((v) => !v)}>{show ? "Cancel" : "New requisition"}</Button>
      </div>

      {show && (
        <form onSubmit={onCreate} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
          {!user?.facility_id && <div className="sm:col-span-2"><Label>Facility ID</Label><Input name="facility_id" required /></div>}
          <div><Label>Patient name</Label><Input name="patient_name" required /></div>
          <div><Label>Hospital ID</Label><Input name="patient_hospital_id" required /></div>
          <div>
            <Label>Blood group</Label>
            <select name="blood_group" className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm">{GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
          </div>
          <div>
            <Label>Component</Label>
            <select name="component_type" className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm">{COMPONENTS.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div><Label>Units</Label><Input name="units_requested" type="number" defaultValue={1} min={1} required /></div>
          <div>
            <Label>Priority</Label>
            <select name="priority" className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm">
              <option value="routine">routine</option>
              <option value="urgent">urgent</option>
              <option value="emergency">emergency</option>
            </select>
          </div>
          <div className="sm:col-span-2"><Label>Indication</Label><Input name="clinical_indication" required /></div>
          <div><Button type="submit" disabled={create.isPending}>Create</Button></div>
          {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
        </form>
      )}

      {isLoading ? <p>Loading…</p> : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Need</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.patient_name}</div>
                    <div className="text-xs text-gray-500">{r.patient_hospital_id}</div>
                  </td>
                  <td className="px-4 py-3">{r.units_requested}× {r.component_type} ({r.blood_group})</td>
                  <td className="px-4 py-3"><Badge>{r.status}</Badge> <Badge>{r.priority}</Badge></td>
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(r.requested_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.status === "pending" && (
                        <Button size="sm" onClick={() => reserve.mutate(r.id)}>Reserve</Button>
                      )}
                      {(r.status === "fully_reserved" || r.status === "partially_reserved") && (
                        <Button size="sm" onClick={() => issue.mutate(r.id)}>Issue</Button>
                      )}
                      {r.status !== "cancelled" && r.status !== "issued" && (
                        <Button size="sm" variant="outline" onClick={() => cancel.mutate(r.id)}>Cancel</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
