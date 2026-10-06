"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  FiltrosPanel,
  type CampoFiltro,
  type ValoresFiltro,
} from "@/components/layout/filtros-panel";
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

  const aplicar = (next: CalendarioFiltrosState) => {
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

  const limpiarFiltros = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const campos: CampoFiltro[] = [
    {
      tipo: "select",
      clave: "responsableUserId",
      etiqueta: "Responsable",
      seccion: "Actividad",
      opciones: responsables.map((r) => ({ value: r.id, label: r.name })),
    },
    {
      tipo: "select",
      clave: "estado",
      etiqueta: "Estado",
      seccion: "Actividad",
      opciones: [...ESTADO_OPCIONES],
    },
    {
      tipo: "select",
      clave: "tipo",
      etiqueta: "Tipo",
      seccion: "Actividad",
      opciones: [...TIPO_OPCIONES],
    },
    {
      tipo: "select",
      clave: "procesoId",
      etiqueta: "Oportunidad",
      seccion: "Actividad",
      placeholderTodos: "Todas",
      opciones: procesos.map((p) => ({
        value: p.id,
        label: `${p.secopId ?? p.id.slice(0, 8)} — ${p.entidad ?? "Sin entidad"}`,
      })),
    },
    {
      tipo: "fechas",
      claveDesde: "fechaDesde",
      claveHasta: "fechaHasta",
      etiqueta: "Rango de fechas",
      seccion: "Fechas",
    },
  ];

  const valoresFiltro: ValoresFiltro = { ...filtros };

  const aplicarFiltros = (v: ValoresFiltro) => {
    if (v.fechaDesde !== filtros.fechaDesde || v.fechaHasta !== filtros.fechaHasta) {
      onDateRangeChange?.(v.fechaDesde, v.fechaHasta);
    }
    aplicar({
      responsableUserId: v.responsableUserId,
      estado: v.estado,
      tipo: v.tipo,
      procesoId: v.procesoId,
      fechaDesde: v.fechaDesde,
      fechaHasta: v.fechaHasta,
    });
  };

  return (
    <div className="flex items-start gap-3">
      <FiltrosPanel
        campos={campos}
        valores={valoresFiltro}
        onAplicar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        deshabilitado={isPending}
      />
      {isPending && (
        <Spinner className="mt-2 size-3.5 text-muted-foreground" aria-label="Actualizando" />
      )}
    </div>
  );
}
