"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildPageItems, formatCount, pageRange } from "@/lib/table-pagination";

export function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  hasNext,
  disabled = false,
  onPageChange,
  itemLabel,
  showSummary = true,
  className,
}: {
  page: number;
  pageSize?: number;
  totalItems?: number;
  /** Si se omite y hay totalItems + pageSize, se calcula. */
  totalPages?: number;
  /** Cuando el total de páginas no se conoce (búsqueda en vivo). */
  hasNext?: boolean;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  showSummary?: boolean;
  className?: string;
}) {
  const jumpId = useId();
  const [jump, setJump] = useState("");

  if (totalItems === 0) return null;

  const resolvedPages =
    totalPages ??
    (totalItems != null && pageSize != null && pageSize > 0
      ? Math.max(1, Math.ceil(totalItems / pageSize))
      : undefined);

  const knownTotal = resolvedPages != null;
  const canPrev = page > 1 && !disabled;
  const canNext = !disabled && (knownTotal ? page < resolvedPages : Boolean(hasNext));
  const showControls = knownTotal ? resolvedPages > 1 : page > 1 || Boolean(hasNext);
  const items = knownTotal ? buildPageItems(page, resolvedPages) : [];
  const showJump = knownTotal && resolvedPages > 7;

  const summary = (() => {
    if (!showSummary) return null;
    if (totalItems != null && pageSize != null) {
      const { start, end } = pageRange(page, pageSize, totalItems);
      if (totalItems === 0) return "Sin registros";
      const noun = itemLabel ? ` ${itemLabel}` : "";
      return `Mostrando ${formatCount(start)}–${formatCount(end)} de ${formatCount(totalItems)}${noun}`;
    }
    if (knownTotal) return `Página ${formatCount(page)} de ${formatCount(resolvedPages)}`;
    return `Página ${formatCount(page)}`;
  })();

  const go = (next: number) => {
    if (disabled) return;
    const upper = knownTotal ? resolvedPages : Number.POSITIVE_INFINITY;
    const target = Math.min(Math.max(1, Math.floor(next)), upper);
    if (!Number.isFinite(target) || target === page) return;
    if (!knownTotal && target > page && !hasNext && target !== 1) return;
    onPageChange(target);
  };

  const submitJump = (event: FormEvent) => {
    event.preventDefault();
    const target = Number(jump);
    if (!Number.isInteger(target) || target < 1) return;
    setJump("");
    go(knownTotal ? Math.min(target, resolvedPages) : target);
  };

  if (!showControls && !summary) return null;

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {summary ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {summary}
        </p>
      ) : null}

      {showControls ? (
        <div className="flex flex-wrap items-center gap-1">
          <PageButton label="Primera página" disabled={!canPrev} onClick={() => go(1)}>
            <ChevronsLeft />
          </PageButton>
          <PageButton label="Página anterior" disabled={!canPrev} onClick={() => go(page - 1)}>
            <ChevronLeft />
            <span className="hidden sm:inline">Anterior</span>
          </PageButton>

          {items.map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                aria-hidden
                className="px-1 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <PageButton
                key={item}
                label={`Página ${item}`}
                current={item === page}
                disabled={disabled}
                onClick={() => go(item)}
              >
                {item}
              </PageButton>
            ),
          )}

          {!knownTotal ? (
            <span className="px-2 text-sm text-muted-foreground">
              Página{" "}
              <span className="font-medium text-foreground tabular-nums">{formatCount(page)}</span>
            </span>
          ) : null}

          <PageButton label="Página siguiente" disabled={!canNext} onClick={() => go(page + 1)}>
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight />
          </PageButton>
          <PageButton
            label="Última página"
            disabled={!canNext || !knownTotal}
            onClick={() => knownTotal && go(resolvedPages)}
            hidden={!knownTotal}
          >
            <ChevronsRight />
          </PageButton>

          {showJump ? (
            <form onSubmit={submitJump} className="ml-1 flex items-center gap-1.5">
              <label htmlFor={jumpId} className="text-xs text-muted-foreground">
                Ir a
              </label>
              <Input
                id={jumpId}
                inputMode="numeric"
                value={jump}
                disabled={disabled}
                onChange={(event) => setJump(event.target.value.replace(/\D/g, ""))}
                className="h-8 w-16 px-2 text-center tabular-nums"
                aria-label={`Ir a página, de 1 a ${resolvedPages}`}
              />
            </form>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

function PageButton({
  label,
  current = false,
  disabled,
  hidden = false,
  onClick,
  children,
}: {
  label: string;
  current?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  if (hidden) return null;
  return (
    <Button
      type="button"
      variant={current ? "default" : "outline"}
      size="sm"
      className="min-w-8 px-2 tabular-nums"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
