import { useMemo, useState } from "react";
import { useAdminUsers, useUpdateAdminUser, type AdminUser } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/rbac";
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
            <div className="font-medium text-gray-900">{u.display_name || u.username}</div>
            <div className="text-xs text-gray-500">@{u.username}</div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: (u) => (
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
            value={u.role}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate({ id: u.id, role: e.target.value })
            }
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r as UserRole]}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: (u) => (
          <div className="text-xs text-gray-600">
            <div>{u.email || "—"}</div>
            <div>{u.phone || "—"}</div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (u) => (
          <Badge className={u.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
            {u.is_active ? "active" : "inactive"}
          </Badge>
        ),
      },
      {
        id: "login",
        header: "Last login",
        cell: (u) => (
          <span className="text-xs text-gray-500">
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
            onClick={() => update.mutate({ id: u.id, is_active: !u.is_active })}
          >
            {u.is_active ? "Deactivate" : "Activate"}
          </Button>
        ),
      },
    ],
    [update]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users & roles</h1>
        <p className="text-sm text-gray-500">
          Superadmin directory of every login account, role assignment, and activation state.
        </p>
      </div>

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
              className="max-w-xs bg-white"
            />
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">All roles</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </>
        }
        footer={
          <p className="text-xs text-gray-500">
            {data?.total ?? 0} user{(data?.total ?? 0) === 1 ? "" : "s"}
          </p>
        }
      />
    </div>
  );
}
