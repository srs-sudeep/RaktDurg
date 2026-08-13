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
      {toolbar ? <div className="border-b border-border bg-card px-4 py-3">{toolbar}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {columns.map((col) => {
                const sortKey = col.sortKey ?? col.id;
                const active = !!onSort && !!col.sortable && orderBy === sortKey;
                return (
                  <th
                    key={col.id}
                    className={cn(
                      "sticky top-0 z-[1] whitespace-nowrap bg-muted/40 px-4 py-2 font-semibold backdrop-blur-sm",
                      col.headerClassName,
                      col.className
                    )}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        title={`Sort by ${typeof col.header === "string" ? col.header : sortKey}`}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                          active && "text-foreground"
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
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "border-b border-border/70 last:border-0 transition-colors",
                    onRowClick
                      ? "cursor-pointer border-l-2 border-l-transparent hover:border-l-primary hover:bg-muted/50"
                      : "hover:bg-muted/40"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-4 py-3 align-middle text-foreground", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {footer ? <div className="border-t border-border bg-card px-4 py-2.5">{footer}</div> : null}
    </div>
  );
}
