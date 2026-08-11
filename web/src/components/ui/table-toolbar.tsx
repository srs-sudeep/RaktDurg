import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export type TableFilterOption = {
  value: string;
  label: string;
};

export type TableFilterConfig = {
  key: string;
  label: string;
  options: TableFilterOption[];
  className?: string;
};

export function TableToolbar({
  search,
  searchPlaceholder = "Search…",
  filters = [],
  filterValues,
  onFilterChange,
  children,
  className,
}: {
  search?: { value: string; onChange: (v: string) => void };
  searchPlaceholder?: string;
  filters?: TableFilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-wrap items-center gap-2", className)}>
      {search && (
        <Input
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-xs"
        />
      )}
      {filters.map((f) => (
        <FormSelect
          key={f.key}
          className={cn("w-40", f.className)}
          aria-label={f.label}
          value={filterValues?.[f.key] ?? ""}
          onChange={(e) => onFilterChange?.(f.key, e.target.value)}
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FormSelect>
      ))}
      {children}
    </div>
  );
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
      <span>
        {total} record{total === 1 ? "" : "s"} · page {page}/{pages}
      </span>
      <button
        type="button"
        className="rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <button
        type="button"
        className="rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
