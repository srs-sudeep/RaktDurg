import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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
    <div className={cn("flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {search && (
        <label className="relative block min-w-[220px] flex-1 sm:max-w-sm">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 border-slate-300 bg-white pl-9 text-[13px] shadow-sm"
          />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <FormSelect
            key={f.key}
            className={cn("h-9 w-44 border-slate-300 bg-white", f.className)}
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
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 text-[12.5px] text-slate-600">
      <span className="tabular-nums">
        Showing <span className="font-semibold text-slate-800">{from}–{to}</span> of{" "}
        <span className="font-semibold text-slate-800">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 tabular-nums text-slate-700">
          {page} / {pages}
        </span>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
