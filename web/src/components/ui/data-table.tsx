import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/lib/table-query";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortKey?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
  orderBy?: string;
  order?: SortDir;
  onSort?: (sortKey: string) => void;
};

function SortIcon({ active, dir }: { active: boolean; dir?: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyMessage = "No records found.",
  className,
  onRowClick,
  toolbar,
  footer,
  orderBy,
  order,
  onSort,
}: DataTableProps<T>) {
  return (
    <div className={cn("surface-card", className)}>
      {toolbar ? <div className="border-b border-slate-200 px-3 py-2">{toolbar}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {columns.map((col) => {
                const sortKey = col.sortKey ?? col.id;
                const active = !!onSort && !!col.sortable && orderBy === sortKey;
                return (
                  <th
                    key={col.id}
                    className={cn("whitespace-nowrap px-3 py-2 font-semibold", col.headerClassName, col.className)}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        title={`Sort by ${typeof col.header === "string" ? col.header : sortKey}`}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-slate-900",
                          active && "text-slate-900"
                        )}
                        onClick={() => onSort(sortKey)}
                      >
                        {col.header}
                        <SortIcon active={active} dir={order} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "border-b border-slate-200 last:border-0",
                    idx % 2 === 1 && "bg-slate-50/80",
                    onRowClick && "cursor-pointer hover:bg-red-50/70"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-3 py-1.5 align-middle text-slate-800", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {footer ? <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">{footer}</div> : null}
    </div>
  );
}
