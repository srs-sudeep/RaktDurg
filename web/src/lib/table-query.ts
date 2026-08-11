import { useCallback, useEffect, useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export type TableQueryState = {
  q: string;
  page: number;
  pageSize: number;
  orderBy: string;
  order: SortDir;
  filters: Record<string, string>;
};

export type UseTableQueryOptions = {
  defaultOrderBy?: string;
  defaultOrder?: SortDir;
  defaultFilters?: Record<string, string>;
  pageSize?: number;
  debounceMs?: number;
};

/** Shared search / filter / sort / page state for staff tables (server or client). */
export function useTableQuery(options: UseTableQueryOptions = {}) {
  const {
    defaultOrderBy = "created_at",
    defaultOrder = "desc",
    defaultFilters = {},
    pageSize = 50,
    debounceMs = 300,
  } = options;

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState(defaultOrderBy);
  const [order, setOrder] = useState<SortDir>(defaultOrder);
  const [filters, setFilters] = useState<Record<string, string>>(defaultFilters);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [qInput, debounceMs]);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
    setPage(1);
  }, []);

  const toggleSort = useCallback((columnId: string) => {
    setOrderBy((prev) => {
      if (prev === columnId) {
        setOrder((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setOrder("asc");
      return columnId;
    });
    setPage(1);
  }, []);

  const params = useMemo(
    () => ({
      q: q || undefined,
      page,
      page_size: pageSize,
      order_by: orderBy || undefined,
      order,
      ...Object.fromEntries(
        Object.entries(filters).map(([k, v]) => [k, v || undefined])
      ),
    }),
    [q, page, pageSize, orderBy, order, filters]
  );

  return {
    qInput,
    setQInput,
    q,
    page,
    setPage,
    pageSize,
    orderBy,
    order,
    filters,
    setFilter,
    toggleSort,
    params,
  };
}

/** Client-side filter + sort for rows already loaded (or when API lacks a param). */
export function applyClientTable<T extends Record<string, unknown>>(
  rows: T[],
  opts: {
    q?: string;
    searchKeys?: (keyof T)[];
    filters?: Record<string, string>;
    filterKeys?: Record<string, keyof T>;
    orderBy?: string;
    order?: SortDir;
  }
): T[] {
  let out = [...rows];
  const q = opts.q?.trim().toLowerCase();
  if (q && opts.searchKeys?.length) {
    out = out.filter((row) =>
      opts.searchKeys!.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
    );
  }
  if (opts.filters && opts.filterKeys) {
    for (const [filterKey, value] of Object.entries(opts.filters)) {
      if (!value) continue;
      const field = opts.filterKeys[filterKey];
      if (!field) continue;
      out = out.filter((row) => String(row[field] ?? "") === value);
    }
  }
  if (opts.orderBy) {
    const dir = opts.order === "asc" ? 1 : -1;
    const key = opts.orderBy;
    out.sort((a, b) => {
      const av = a[key as keyof T];
      const bv = b[key as keyof T];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { sensitivity: "base", numeric: true }) * dir;
    });
  }
  return out;
}
