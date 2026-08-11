import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useCreateDonor, useDonors } from "@/api/donors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bloodGroupColor, cn } from "@/lib/utils";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useDonors(page);
  const create = useCreateDonor();
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await create.mutateAsync({
        name: fd.get("name"),
        date_of_birth: fd.get("date_of_birth"),
        sex: fd.get("sex"),
        contact_phone: fd.get("contact_phone"),
        address: fd.get("address"),
        blood_group: fd.get("blood_group"),
        consent_given: true,
      });
      setShowForm(false);
      e.currentTarget.reset();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail?.toString() ?? "Failed to register donor");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donors</h1>
          <p className="text-sm text-gray-500">Register and look up donor records.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Register donor"}</Button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
          <div><Label>Name</Label><Input name="name" required /></div>
          <div><Label>Date of birth</Label><Input name="date_of_birth" type="date" required /></div>
          <div>
            <Label>Sex</Label>
            <select name="sex" className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm" required>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
          <div><Label>Phone</Label><Input name="contact_phone" required minLength={10} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Input name="address" required /></div>
          <div>
            <Label>Blood group</Label>
            <select name="blood_group" className="mt-1 flex h-9 w-full rounded-md border px-3 text-sm" required>
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-end"><Button type="submit" disabled={create.isPending}>Save</Button></div>
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
        </form>
      )}

      {isLoading ? <p>Loading…</p> : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3"><Link to={`/donors/${d.id}`} className="font-medium text-red-700 hover:underline">{d.name}</Link></td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", bloodGroupColor(d.blood_group))}>{d.blood_group}</span></td>
                  <td className="px-4 py-3">{d.contact_phone}</td>
                  <td className="px-4 py-3"><Badge>{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
