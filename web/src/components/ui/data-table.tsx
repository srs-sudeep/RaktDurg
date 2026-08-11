import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
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
};

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
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn("whitespace-nowrap px-3 py-2.5 font-semibold", col.headerClassName, col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-slate-500">
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
                    idx % 2 === 1 && "bg-slate-50/40",
                    onRowClick && "cursor-pointer hover:bg-red-50/40"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-3 py-2.5 align-middle text-slate-800", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2">
          {footer}
        </div>
      )}
    </div>
  );
}
