import { useMemo, useState } from "react";
import { useAdminUsers, useUpdateAdminUser, type AdminUser } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormSelect } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/panel";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/rbac";
import { showSuccessToast } from "@/lib/toast";
import { formatDateTime } from "@/lib/utils";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const { data, isLoading } = useAdminUsers({ q: q || undefined, role: role || undefined });
  const update = useUpdateAdminUser();

  const columns = useMemo<DataTableColumn<AdminUser>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: (u) => (
          <div>
            <div className="font-medium text-slate-900">{u.display_name || u.username}</div>
            <div className="text-[11px] text-slate-500">@{u.username}</div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: (u) => (
          <FormSelect
            className="h-7 w-[150px] text-[12px]"
            value={u.role}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate(
                { id: u.id, role: e.target.value },
                {
                  onSuccess: () => showSuccessToast("Role updated"),
                }
              )
            }
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r as UserRole]}
              </option>
            ))}
          </FormSelect>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: (u) => (
          <div className="text-[12px] text-slate-600">
            <div>{u.email || "—"}</div>
            <div>{u.phone || "—"}</div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (u) => (
          <Badge className={u.is_active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}>
            {u.is_active ? "active" : "inactive"}
          </Badge>
        ),
      },
      {
        id: "login",
        header: "Last login",
        cell: (u) => (
          <span className="text-[12px] text-slate-500">
            {u.last_login_at ? formatDateTime(u.last_login_at) : "Never"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (u) => (
          <Button
            size="sm"
            variant="outline"
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { id: u.id, is_active: !u.is_active },
                {
                  onSuccess: () =>
                    showSuccessToast(u.is_active ? "User deactivated" : "User activated"),
                }
              )
            }
          >
            {u.is_active ? "Deactivate" : "Activate"}
          </Button>
        ),
      },
    ],
    [update]
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Users & roles"
        description="Account directory, role assignment, and activation."
      />

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="No users match this filter."
        toolbar={
          <>
            <Input
              placeholder="Search username, name, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <FormSelect
              className="w-44"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">All roles</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </FormSelect>
          </>
        }
        footer={
          <p className="text-[11px] text-slate-500">
            {data?.total ?? 0} user{(data?.total ?? 0) === 1 ? "" : "s"}
          </p>
        }
      />
    </div>
  );
}
