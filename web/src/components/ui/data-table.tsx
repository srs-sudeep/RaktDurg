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
  /** Enable click-to-sort on this column (server or client). */
  sortable?: boolean;
  /** Sort key sent to API / used client-side (defaults to id). */
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
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-red-600" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-red-600" />
  );
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
    <div
      className={cn(
        "surface-card",
        className
      )}
    >
      {toolbar && (
        <div className="border-b border-slate-200 bg-slate-50 px-3.5 py-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Search & filters
          </div>
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-200/90 bg-white text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500">
              {columns.map((col) => {
                const sortKey = col.sortKey ?? col.id;
                const active = !!onSort && !!col.sortable && orderBy === sortKey;
                return (
                  <th
                    key={col.id}
                    className={cn("whitespace-nowrap px-3.5 py-3 font-semibold", col.headerClassName, col.className)}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        title={`Sort by ${typeof col.header === "string" ? col.header : sortKey}`}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition",
                          active
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
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
                <td colSpan={columns.length} className="px-3.5 py-12 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3.5 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "border-b border-slate-100/90 last:border-0 transition-colors",
                    idx % 2 === 1 && "bg-slate-50/50",
                    onRowClick && "cursor-pointer hover:bg-red-50/50"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-3.5 py-2.5 align-middle text-slate-800", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="border-t border-slate-200 bg-slate-50 px-3.5 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
