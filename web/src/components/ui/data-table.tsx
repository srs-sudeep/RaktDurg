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
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn("px-4 py-3 font-semibold", col.headerClassName, col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "border-b border-gray-100 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-red-50/40"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-4 py-3 align-middle text-gray-800", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
