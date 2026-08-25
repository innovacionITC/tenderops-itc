"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowUpDown, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { ItcTable, type TableColumn, ItcInput, ItcDateRangePicker, ItcButton } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { formatDate } from "@/lib/format";
import {
  AUDITORIA_MODULOS,
  AUDITORIA_TIPOS_OPERACION,
  AUDITORIA_RESULTADOS,
  AUDITORIA_ROLES,
  AUDITORIA_MENSAJE_VACIO,
  type AuditoriaRow,
  type AuditoriaFiltrosDisponibles,
} from "@/lib/auditoria-shared";
import type { Paginado } from "@/lib/secop-shared";
import type { DateRange } from "react-day-picker";
import { DetalleAuditoriaModal } from "./detalle-auditoria-modal";

const PAGE_SIZES = [10, 25, 50, 100] as const;

function SortButton({
  columnKey,
  label,
  activeSortBy,
  onSort,
}: {
  columnKey: string;
  label: string;
  activeSortBy: string;
  onSort: (key: string) => void;
}) {
  const isActive = activeSortBy === columnKey;
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 text-xs ${isActive ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      onClick={() => onSort(columnKey)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

function toIsoDate(d: Date | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

type FiltrosState = {
  userId: string;
  role: string;
  module: string;
  operationType: string;
  result: string;
  fechaDesde: string;
  fechaHasta: string;
  sortBy: string;
  sortDir: string;
  pageSize: number;
};

export function AuditoriaView({
  eventos,
  filtros,
  filtrosDisponibles,
}: {
  eventos: Paginado<AuditoriaRow>;
  filtros: FiltrosState;
  filtrosDisponibles: AuditoriaFiltrosDisponibles;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [detalleTarget, setDetalleTarget] = useState<AuditoriaRow | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = fromIsoDate(filtros.fechaDesde);
    const to = fromIsoDate(filtros.fechaHasta);
    return from || to ? { from, to } : undefined;
  });

  const aplicar = (cambios: Partial<FiltrosState & { page: number }>) => {
    const next = {
      userId: cambios.userId ?? filtros.userId,
      role: cambios.role ?? filtros.role,
      module: cambios.module ?? filtros.module,
      operationType: cambios.operationType ?? filtros.operationType,
      result: cambios.result ?? filtros.result,
      fechaDesde: cambios.fechaDesde ?? filtros.fechaDesde,
      fechaHasta: cambios.fechaHasta ?? filtros.fechaHasta,
      sortBy: cambios.sortBy ?? filtros.sortBy,
      sortDir: cambios.sortDir ?? filtros.sortDir,
      pageSize: cambios.pageSize ?? filtros.pageSize,
      page: cambios.page ?? 1,
    };

    const qs = new URLSearchParams();
    if (next.userId) qs.set("userId", next.userId);
    if (next.role) qs.set("role", next.role);
    if (next.module) qs.set("module", next.module);
    if (next.operationType) qs.set("operationType", next.operationType);
    if (next.result) qs.set("result", next.result);
    if (next.fechaDesde) qs.set("fechaDesde", next.fechaDesde);
    if (next.fechaHasta) qs.set("fechaHasta", next.fechaHasta);
    if (next.sortBy !== "createdAt") qs.set("sortBy", next.sortBy);
    if (next.sortDir !== "desc") qs.set("sortDir", next.sortDir);
    if (next.pageSize !== 50) qs.set("pageSize", String(next.pageSize));
    if (next.page > 1) qs.set("page", String(next.page));

    startTransition(() => {
      router.push(`${pathname}?${qs}`);
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    aplicar({
      fechaDesde: toIsoDate(range?.from),
      fechaHasta: toIsoDate(range?.to),
    });
  };

  const handleSort = (columnKey: string) => {
    const currentSortBy = filtros.sortBy;
    const currentSortDir = filtros.sortDir;
    const nextDir = currentSortBy === columnKey && currentSortDir === "asc" ? "desc" : "asc";
    aplicar({ sortBy: columnKey, sortDir: nextDir });
  };

  const columns: TableColumn<AuditoriaRow>[] = [
    {
      key: "createdAt",
      title: <SortButton columnKey="createdAt" label="Fecha/hora" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "12%",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span>
      ),
    },
    {
      key: "userName",
      title: <SortButton columnKey="userName" label="Usuario" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "15%",
      render: (r) => (
        <span className="block truncate text-sm" title={r.userName ?? undefined}>
          {r.userName ?? "—"}
        </span>
      ),
    },
    {
      key: "role",
      title: <span className="text-xs text-muted-foreground">Rol</span>,
      width: "6%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.role ?? undefined}>
          {r.role ?? "—"}
        </span>
      ),
    },
    {
      key: "module",
      title: <SortButton columnKey="module" label="Módulo" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "9%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.module ?? undefined}>
          {r.module ?? "—"}
        </span>
      ),
    },
    {
      key: "description",
      title: <span className="text-xs text-muted-foreground">Funcionalidad</span>,
      width: "20%",
      render: (r) => (
        <span className="block truncate text-sm" title={r.description}>
          {r.description}
        </span>
      ),
    },
    {
      key: "operationType",
      title: <span className="text-xs text-muted-foreground">Tipo operación</span>,
      width: "11%",
      render: (r) => <StatusBadge tone="info">{r.operationType}</StatusBadge>,
    },
    {
      key: "action",
      title: <SortButton columnKey="action" label="Acción" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "15%",
      render: (r) => (
        <span className="block truncate text-sm font-mono" title={r.action}>
          {r.action}
        </span>
      ),
    },
    {
      key: "result",
      title: <SortButton columnKey="result" label="Resultado" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "8%",
      render: (r) => (
        <StatusBadge tone={r.result === "ok" ? "success" : "danger"}>
          {r.result ?? "—"}
        </StatusBadge>
      ),
    },
    {
      key: "acciones",
      title: "",
      width: 50,
      align: "right",
      render: (r) => (
        <RowActionButton
          icon={<Info className="h-3.5 w-3.5" />}
          title="Ver detalle"
          onClick={() => setDetalleTarget(r)}
        />
      ),
    },
  ];

  const totalPaginas = Math.max(Math.ceil(eventos.total / eventos.pageSize), 1);

  return (
    <div className="space-y-6">
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-1.5">Usuario</Label>
            <ItcInput
              type="select"
              value={filtros.userId}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ userId: e.target.value })
              }
            >
              <option value="">Todos</option>
              {filtrosDisponibles.usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Rol</Label>
            <ItcInput
              type="select"
              value={filtros.role}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ role: e.target.value })
              }
            >
              <option value="">Todos</option>
              {AUDITORIA_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Módulo</Label>
            <ItcInput
              type="select"
              value={filtros.module}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ module: e.target.value })
              }
            >
              <option value="">Todos</option>
              {AUDITORIA_MODULOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Tipo de operación</Label>
            <ItcInput
              type="select"
              value={filtros.operationType}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ operationType: e.target.value })
              }
            >
              <option value="">Todos</option>
              {AUDITORIA_TIPOS_OPERACION.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Resultado</Label>
            <ItcInput
              type="select"
              value={filtros.result}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ result: e.target.value })
              }
            >
              <option value="">Todos</option>
              {AUDITORIA_RESULTADOS.map((r) => (
                <option key={r} value={r}>{r === "ok" ? "Exitoso" : "Error"}</option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Fecha</Label>
            <ItcDateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {eventos.total} registro{eventos.total !== 1 ? "s" : ""} de auditoría
          </span>
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <ItcInput
              type="select"
              className="w-20"
              value={String(filtros.pageSize)}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ pageSize: Number(e.target.value) })
              }
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </ItcInput>
          </div>
        </div>

        {eventos.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {AUDITORIA_MENSAJE_VACIO}
          </div>
        ) : (
          <ItcTable
            data={eventos.items}
            columns={columns}
            rowKey={(r) => r.id}
            pagination={false}
            tableLayout="fixed"
            responsiveStrategy="cards"
            striped
            hoverable
            stickyHeader
            ariaLabel="Tabla de auditoría"
          />
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Página {eventos.page} de {totalPaginas}
            </span>
            <div className="flex gap-1">
              <ItcButton
                size="sm"
                disabled={eventos.page <= 1 || isPending}
                onClick={() => aplicar({ page: eventos.page - 1 } as Partial<FiltrosState & { page: number }>)}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </ItcButton>
              <ItcButton
                size="sm"
                disabled={eventos.page >= totalPaginas || isPending}
                onClick={() => aplicar({ page: eventos.page + 1 } as Partial<FiltrosState & { page: number }>)}
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </ItcButton>
            </div>
          </div>
        )}
      </div>

      <DetalleAuditoriaModal
        evento={detalleTarget}
        onClose={() => setDetalleTarget(null)}
      />
    </div>
  );
}
