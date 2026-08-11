import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateDonor, useDonors } from "@/api/donors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormActions, FormField, FormGrid, FormInput, FormSelect } from "@/components/ui/form";
import { PageHeader, Panel } from "@/components/ui/panel";
import { TablePagination, TableToolbar } from "@/components/ui/table-toolbar";
import { useTableQuery } from "@/lib/table-query";
import { showSuccessToast } from "@/lib/toast";
import { bloodGroupColor, cn } from "@/lib/utils";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type DonorRow = {
  id: string;
  name: string;
  blood_group: string | null;
  contact_phone: string;
  status: string;
  created_at?: string;
};

export default function DonorsPage() {
  const table = useTableQuery({ defaultOrderBy: "created_at", defaultOrder: "desc", pageSize: 20 });
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useDonors({
    page: table.page,
    page_size: table.pageSize,
    q: table.q || undefined,
    blood_group: table.filters.blood_group || undefined,
    status: table.filters.status || undefined,
    order_by: table.orderBy,
    order: table.order,
  });
  const create = useCreateDonor();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      showSuccessToast("Donor registered");
      setShowForm(false);
      e.currentTarget.reset();
    } catch {
      /* errors toasted by api client */
    }
  }

  const columns = useMemo<DataTableColumn<DonorRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        sortable: true,
        cell: (d) => (
          <Link to={`/donors/${d.id}`} className="font-medium text-red-700 hover:underline">
            {d.name}
          </Link>
        ),
      },
      {
        id: "blood_group",
        header: "Group",
        sortable: true,
        cell: (d) => (
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", bloodGroupColor(d.blood_group ?? ""))}>
            {d.blood_group ?? "—"}
          </span>
        ),
      },
      { id: "phone", header: "Phone", cell: (d) => d.contact_phone },
      { id: "status", header: "Status", sortable: true, cell: (d) => <Badge>{d.status}</Badge> },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <PageHeader
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close form" : "Register donor"}
          </Button>
        }
      />

      {showForm && (
        <Panel title="New donor" description="Mandatory fields marked with *">
          <form onSubmit={onSubmit} className="space-y-3">
            <FormGrid>
              <FormField label="Name" htmlFor="name" required>
                <FormInput id="name" name="name" required />
              </FormField>
              <FormField label="Date of birth" htmlFor="date_of_birth" required>
                <FormInput id="date_of_birth" name="date_of_birth" type="date" required />
              </FormField>
              <FormField label="Sex" htmlFor="sex" required>
                <FormSelect id="sex" name="sex" required>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </FormSelect>
              </FormField>
              <FormField label="Phone" htmlFor="contact_phone" required>
                <FormInput id="contact_phone" name="contact_phone" required minLength={10} />
              </FormField>
              <FormField label="Address" htmlFor="address" required className="sm:col-span-2">
                <FormInput id="address" name="address" required />
              </FormField>
              <FormField label="Blood group" htmlFor="blood_group" required>
                <FormSelect id="blood_group" name="blood_group" required>
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </FormSelect>
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Save donor"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </FormActions>
          </form>
        </Panel>
      )}

      <DataTable
        columns={columns}
        rows={(data?.items ?? []) as DonorRow[]}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        onRowClick={(d) => navigate(`/donors/${d.id}`)}
        emptyMessage="No donors match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search name or phone…"
            filters={[
              {
                key: "blood_group",
                label: "All groups",
                options: GROUPS.map((g) => ({ value: g, label: g })),
              },
              {
                key: "status",
                label: "All statuses",
                options: [
                  { value: "active", label: "Active" },
                  { value: "deferred", label: "Deferred" },
                  { value: "inactive", label: "Inactive" },
                ],
              },
            ]}
            filterValues={table.filters}
            onFilterChange={table.setFilter}
          />
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
