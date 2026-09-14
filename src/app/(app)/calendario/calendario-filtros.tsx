"use client";

import { type ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ItcInput, ItcDateRangePicker } from "@/components/itc";
import type { UsuarioAsignableRow } from "@/lib/usuarios-asignables";
import type { ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";

export const ESTADO_OPCIONES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "proxima_a_vencer", label: "Próxima a vencer" },
  { value: "vencida", label: "Vencida" },
  { value: "completada", label: "Completada" },
] as const;

export const TIPO_OPCIONES = [
  { value: "event", label: "Evento" },
  { value: "task", label: "Tarea" },
  { value: "secop_closing", label: "Cierre SECOP" },
] as const;

export type CalendarioFiltrosState = {
  responsableUserId: string;
  estado: string;
  tipo: string;
  procesoId: string;
  fechaDesde: string;
  fechaHasta: string;
};

export function CalendarioFiltrosBar({
  filtros,
  responsables,
  procesos,
  onDateRangeChange,
}: {
  filtros: CalendarioFiltrosState;
  responsables: UsuarioAsignableRow[];
  procesos: ProcesoSeguimientoRow[];
  onDateRangeChange?: (from: string, to: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const aplicar = (cambios: Partial<CalendarioFiltrosState>) => {
    const next = {
      responsableUserId: cambios.responsableUserId ?? filtros.responsableUserId,
      estado: cambios.estado ?? filtros.estado,
      tipo: cambios.tipo ?? filtros.tipo,
      procesoId: cambios.procesoId ?? filtros.procesoId,
      fechaDesde: cambios.fechaDesde ?? filtros.fechaDesde,
      fechaHasta: cambios.fechaHasta ?? filtros.fechaHasta,
    };

    const qs = new URLSearchParams();
    if (next.responsableUserId) qs.set("responsableUserId", next.responsableUserId);
    if (next.estado) qs.set("estado", next.estado);
    if (next.tipo) qs.set("tipo", next.tipo);
    if (next.procesoId) qs.set("procesoId", next.procesoId);
    if (next.fechaDesde) qs.set("fechaDesde", next.fechaDesde);
    if (next.fechaHasta) qs.set("fechaHasta", next.fechaHasta);

    startTransition(() => {
      router.push(`${pathname}?${qs}`);
    });
  };

  const dateRange = filtros.fechaDesde || filtros.fechaHasta
    ? {
        from: fromIsoDate(filtros.fechaDesde),
        to: fromIsoDate(filtros.fechaHasta),
      }
    : undefined;

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    const from = range?.from ? toIsoDate(range.from) : "";
    const to = range?.to ? toIsoDate(range.to) : "";
    onDateRangeChange?.(from, to);
    aplicar({ fechaDesde: from, fechaHasta: to });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      {isPending && (
        <Spinner className="mb-2 size-3.5 self-end text-muted-foreground" aria-label="Actualizando" />
      )}
      <div className="w-36">
        <Label className="mb-1.5">Responsable</Label>
        <ItcInput
          type="select"
          className="w-full"
          value={filtros.responsableUserId}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            aplicar({ responsableUserId: e.target.value })
          }
        >
          <option value="">Todos</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </ItcInput>
      </div>
      <div className="w-36">
        <Label className="mb-1.5">Estado</Label>
        <ItcInput
          type="select"
          className="w-full"
          value={filtros.estado}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            aplicar({ estado: e.target.value })
          }
        >
          <option value="">Todos</option>
          {ESTADO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </ItcInput>
      </div>
      <div className="w-36">
        <Label className="mb-1.5">Tipo</Label>
        <ItcInput
          type="select"
          className="w-full"
          value={filtros.tipo}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            aplicar({ tipo: e.target.value })
          }
        >
          <option value="">Todos</option>
          {TIPO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </ItcInput>
      </div>
      <div className="w-48">
        <Label className="mb-1.5">Oportunidad</Label>
        <ItcInput
          type="select"
          className="w-full"
          value={filtros.procesoId}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            aplicar({ procesoId: e.target.value })
          }
        >
          <option value="">Todas</option>
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.secopId ?? p.id.slice(0, 8)} — {p.entidad ?? "Sin entidad"}
            </option>
          ))}
        </ItcInput>
      </div>
      <div className="w-56">
        <Label className="mb-1.5">Rango de fechas</Label>
        <ItcDateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
        />
      </div>
    </div>
  );
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}
