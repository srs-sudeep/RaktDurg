import { useMemo } from "react";
import { useAdminUsers, useUpdateAdminUser, type AdminUser } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormSelect } from "@/components/ui/form";
import { TablePagination, TableToolbar } from "@/components/ui/table-toolbar";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/rbac";
import { useTableQuery } from "@/lib/table-query";
import { showSuccessToast } from "@/lib/toast";
import { formatDateTime } from "@/lib/utils";

export default function UsersPage() {
  const table = useTableQuery({ defaultOrderBy: "username", defaultOrder: "asc", pageSize: 50 });
  const { data, isLoading } = useAdminUsers({
    page: table.page,
    q: table.q || undefined,
    role: table.filters.role || undefined,
    order_by: table.orderBy,
    order: table.order,
  });
  const update = useUpdateAdminUser();

  const columns = useMemo<DataTableColumn<AdminUser>[]>(
    () => [
      {
        id: "username",
        header: "User",
        sortable: true,
        cell: (u) => (
          <div>
            <div className="font-medium text-foreground">{u.display_name || u.username}</div>
            <div className="text-[11px] text-muted-foreground">@{u.username}</div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        sortable: true,
        cell: (u) => (
          <FormSelect
            className="h-7 w-[150px] text-[12px]"
            value={u.role}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate(
                { id: u.id, role: e.target.value },
                { onSuccess: () => showSuccessToast("Role updated") }
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
          <div>
            <div>{u.email || "—"}</div>
            <div className="text-[11px] text-muted-foreground">{u.phone || "—"}</div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (u) => (
          <Badge
            className={
              u.is_active
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-muted text-muted-foreground"
            }
          >
            {u.is_active ? "active" : "inactive"}
          </Badge>
        ),
      },
      {
        id: "last_login_at",
        header: "Last login",
        sortable: true,
        cell: (u) => (
          <span className="text-[11px] text-muted-foreground">
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
    <div className="space-y-4">
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="No users match this filter."
        orderBy={table.orderBy}
        order={table.order}
        onSort={table.toggleSort}
        toolbar={
          <TableToolbar
            search={{ value: table.qInput, onChange: table.setQInput }}
            searchPlaceholder="Search username, name, email…"
            filters={[
              {
                key: "role",
                label: "All roles",
                options: USER_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
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
