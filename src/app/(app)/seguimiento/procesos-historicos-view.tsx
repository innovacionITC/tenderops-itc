"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, ArrowUpDown, ChevronLeft, ChevronRight as ChevronRightIcon, Info } from "lucide-react";
import { ItcTable, type TableColumn, ItcInput, ItcDateRangePicker, ItcButton } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { formatCOP, formatDate } from "@/lib/format";
import {
  ESTADO_FINAL_OPCIONES,
  HISTORICOS_MENSAJE_VACIO,
  type ProcesoHistoricoRow,
  type HistoricosFiltrosDisponibles,
} from "@/lib/seguimiento-historicos-shared";
import type { Paginado } from "@/lib/secop-shared";
import type { DateRange } from "react-day-picker";
import { DetalleProcesoHistoricoModal } from "./detalle-proceso-historico-modal";

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
  numeroProceso: string;
  entidad: string;
  responsableUserId: string;
  estadoFinal: string;
  fechaDesde: string;
  fechaHasta: string;
  palabraClave: string;
  sortBy: string;
  sortDir: string;
  pageSize: number;
};

export function ProcesosHistoricosView({
  procesos,
  filtros,
  filtrosDisponibles,
}: {
  procesos: Paginado<ProcesoHistoricoRow>;
  filtros: FiltrosState;
  filtrosDisponibles: HistoricosFiltrosDisponibles;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [numeroProceso, setNumeroProceso] = useState(filtros.numeroProceso);
  const [entidad, setEntidad] = useState(filtros.entidad);
  const [palabraClave, setPalabraClave] = useState(filtros.palabraClave);
  const [detalleTarget, setDetalleTarget] = useState<ProcesoHistoricoRow | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = fromIsoDate(filtros.fechaDesde);
    const to = fromIsoDate(filtros.fechaHasta);
    return from || to ? { from, to } : undefined;
  });

  const aplicar = (cambios: Partial<FiltrosState & { page: number }>) => {
    const next = {
      numeroProceso: cambios.numeroProceso ?? numeroProceso,
      entidad: cambios.entidad ?? entidad,
      responsableUserId: cambios.responsableUserId ?? filtros.responsableUserId,
      estadoFinal: cambios.estadoFinal ?? filtros.estadoFinal,
      fechaDesde: cambios.fechaDesde ?? filtros.fechaDesde,
      fechaHasta: cambios.fechaHasta ?? filtros.fechaHasta,
      palabraClave: cambios.palabraClave ?? palabraClave,
      sortBy: cambios.sortBy ?? filtros.sortBy,
      sortDir: cambios.sortDir ?? filtros.sortDir,
      pageSize: cambios.pageSize ?? filtros.pageSize,
      page: cambios.page ?? 1,
    };

    const qs = new URLSearchParams();
    qs.set("vista", "historicos");
    if (next.numeroProceso.trim()) qs.set("numeroProceso", next.numeroProceso.trim());
    if (next.entidad.trim()) qs.set("entidad", next.entidad.trim());
    if (next.responsableUserId) qs.set("responsableUserId", next.responsableUserId);
    if (next.estadoFinal) qs.set("estadoFinal", next.estadoFinal);
    if (next.fechaDesde) qs.set("fechaDesde", next.fechaDesde);
    if (next.fechaHasta) qs.set("fechaHasta", next.fechaHasta);
    if (next.palabraClave.trim()) qs.set("palabraClave", next.palabraClave.trim());
    if (next.sortBy !== "fechaCierre") qs.set("sortBy", next.sortBy);
    if (next.sortDir !== "desc") qs.set("sortDir", next.sortDir);
    if (next.pageSize !== 25) qs.set("pageSize", String(next.pageSize));
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

  const columns: TableColumn<ProcesoHistoricoRow>[] = [
    {
      key: "secopId",
      title: <SortButton columnKey="numeroProceso" label="N° proceso" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "9%",
      render: (r) => (
        <span className="block truncate text-sm font-mono" title={r.secopId ?? undefined}>
          {r.secopId ?? "—"}
        </span>
      ),
    },
    {
      key: "entidad",
      title: <SortButton columnKey="entidad" label="Entidad" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "15%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.entidad ?? undefined}>
          {r.entidad ?? "—"}
        </span>
      ),
    },
    {
      key: "objeto",
      title: <SortButton columnKey="objeto" label="Objeto" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "18%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.objeto ?? undefined}>
          {r.objeto ?? "—"}
        </span>
      ),
    },
    {
      key: "responsableNombre",
      title: <SortButton columnKey="responsable" label="Responsable" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "10%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.responsableNombre ?? undefined}>
          {r.responsableNombre ?? "—"}
        </span>
      ),
    },
    {
      key: "estadoFinal",
      title: <SortButton columnKey="estadoFinal" label="Estado final" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "8%",
      render: (r) => {
        const tone = r.estadoFinal === "Perdido" ? "danger" : r.estadoFinal === "Descartado" ? "muted" : "info";
        return <StatusBadge tone={tone}>{r.estadoFinal}</StatusBadge>;
      },
    },
    {
      key: "motivoCierre",
      title: <span className="text-xs text-muted-foreground">Motivo de cierre</span>,
      width: "10%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.motivoCierre}>
          {r.motivoCierre}
        </span>
      ),
    },
    {
      key: "valor",
      title: <SortButton columnKey="valorEstimado" label="Valor" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "9%",
      align: "right",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>
      ),
    },
    {
      key: "fechaCierre",
      title: <SortButton columnKey="fechaCierre" label="Fecha cierre" activeSortBy={filtros.sortBy} onSort={handleSort} />,
      width: "8%",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.fechaCierre)}</span>
      ),
    },
    {
      key: "fechaUltimaActualizacion",
      title: <span className="text-xs text-muted-foreground">Últ. actualización</span>,
      width: "9%",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.fechaUltimaActualizacion)}</span>
      ),
    },
    {
      key: "acciones",
      title: "",
      width: 80,
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <RowActionButton
            icon={<Info className="h-3.5 w-3.5" />}
            title="Ver detalle"
            onClick={() => setDetalleTarget(r)}
          />
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Abrir seguimiento completo"
            onClick={() => router.push(`/seguimiento/${r.id}`)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const totalPaginas = Math.max(Math.ceil(procesos.total / procesos.pageSize), 1);

  return (
    <div className="space-y-6">
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-1.5">Número del proceso</Label>
            <ItcInput
              value={numeroProceso}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setNumeroProceso(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") aplicar({ numeroProceso });
              }}
              placeholder="Ej: 2024-01-00001"
            />
          </div>
          <div>
            <Label className="mb-1.5">Entidad</Label>
            <ItcInput
              value={entidad}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setEntidad(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") aplicar({ entidad });
              }}
              placeholder="Buscar entidad…"
            />
          </div>
          <div>
            <Label className="mb-1.5">Responsable</Label>
            <ItcInput
              type="select"
              value={filtros.responsableUserId}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ responsableUserId: e.target.value })
              }
            >
              <option value="">Todos</option>
              {filtrosDisponibles.responsables.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Estado final</Label>
            <ItcInput
              type="select"
              value={filtros.estadoFinal}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ estadoFinal: e.target.value })
              }
            >
              <option value="">Todos</option>
              {ESTADO_FINAL_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Fecha de cierre</Label>
            <ItcDateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Palabra clave</Label>
            <ItcInput
              value={palabraClave}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setPalabraClave(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") aplicar({ palabraClave });
              }}
              placeholder="Buscar en entidad, objeto o número…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {procesos.total} proceso{procesos.total !== 1 ? "s" : ""} histórico{procesos.total !== 1 ? "s" : ""}
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

        {procesos.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {HISTORICOS_MENSAJE_VACIO}
          </div>
        ) : (
          <ItcTable
            data={procesos.items}
            columns={columns}
            rowKey={(r) => r.id}
            pagination={false}
            tableLayout="fixed"
            responsiveStrategy="cards"
            striped
            hoverable
            stickyHeader
            ariaLabel="Tabla de procesos históricos"
          />
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Página {procesos.page} de {totalPaginas}
            </span>
            <div className="flex gap-1">
              <ItcButton
                size="sm"
                disabled={procesos.page <= 1 || isPending}
                onClick={() => aplicar({ page: procesos.page - 1 } as Partial<FiltrosState & { page: number }>)}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </ItcButton>
              <ItcButton
                size="sm"
                disabled={procesos.page >= totalPaginas || isPending}
                onClick={() => aplicar({ page: procesos.page + 1 } as Partial<FiltrosState & { page: number }>)}
              >
                Siguiente <ChevronRightIcon className="h-4 w-4" />
              </ItcButton>
            </div>
          </div>
        )}
      </div>

      <DetalleProcesoHistoricoModal
        proceso={detalleTarget}
        onClose={() => setDetalleTarget(null)}
      />
    </div>
  );
}
