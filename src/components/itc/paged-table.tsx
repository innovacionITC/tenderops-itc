"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { ItcInput, ItcTable as ItcTableBase, type TableProps } from "itc-frontend-base";
import { TablePagination } from "@/components/layout/table-pagination";

type PagedTableExtra = {
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  showSearch?: boolean;
  searchKeys?: string[];
  searchPlaceholder?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesQuery(row: object, keys: string[] | undefined, query: string) {
  const needle = normalize(query.trim());
  if (!needle) return true;
  const record = row as Record<string, unknown>;
  const fields = keys?.length ? keys : Object.keys(record);
  return fields.some((key) => {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      return normalize(String(value)).includes(needle);
    }
    return false;
  });
}

export function ItcTable<T extends object>(props: TableProps<T> & PagedTableExtra & { data: T[] }) {
  if (props.pagination !== true) {
    return <ItcTableBase {...props} />;
  }
  return <ClientPagedTable {...props} />;
}

function ClientPagedTable<T extends object>({
  data,
  pagination,
  pageSize: pageSizeProp = 10,
  pageSizeOptions,
  showSearch,
  searchKeys,
  searchPlaceholder = "Buscar…",
  ...rest
}: TableProps<T> & PagedTableExtra & { data: T[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeProp);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (showSearch ? data.filter((row) => matchesQuery(row, searchKeys, query)) : data),
    [data, query, searchKeys, showSearch],
  );

  if (pagination !== true) return null;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return (
    <div className="space-y-3">
      {showSearch || (pageSizeOptions && pageSizeOptions.length > 0) ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {showSearch ? (
            <ItcInput
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="max-w-sm"
              onChange={(
                event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
              ) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          ) : (
            <span />
          )}
          {pageSizeOptions && pageSizeOptions.length > 0 ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Filas
              <select
                className="crystal-field h-9 px-2 text-sm text-foreground"
                value={pageSize}
                aria-label="Filas por página"
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 && query.trim() ? (
        <p className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin resultados para la búsqueda.
        </p>
      ) : (
        <ItcTableBase {...rest} data={pageRows} pagination={false} showSearch={false} />
      )}

      <TablePagination
        page={safePage}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}
