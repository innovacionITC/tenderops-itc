import "server-only";
import { apiFetch } from "@/lib/api/client";

export type Actividad = {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  eventType: string | null;
  source: "event" | "secop_closing";
  processId: string | null;
  numeroProceso: string | null;
  entidad: string | null;
  responsableUserId: string | null;
  responsableNombre: string | null;
  prioridad: string | null;
  estado: "vencida" | "proxima_a_vencer" | "pendiente";
};

type ActividadResponse = {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  eventType: string | null;
  source: string;
  processId: string | null;
  numeroProceso: string | null;
  entidad: string | null;
  responsableUserId: string | null;
  responsableNombre: string | null;
  prioridad: string | null;
  estado: string;
};

export type CalendarioFiltros = {
  fechaDesde?: string;
  fechaHasta?: string;
  responsableUserId?: string;
  estado?: string;
  tipo?: string;
  procesoId?: string;
};

export async function listCalendar(filtros?: CalendarioFiltros): Promise<Actividad[]> {
  const items = await apiFetch<ActividadResponse[]>("/calendario", {
    query: {
      fechaDesde: filtros?.fechaDesde,
      fechaHasta: filtros?.fechaHasta,
      responsableUserId: filtros?.responsableUserId,
      estado: filtros?.estado,
      tipo: filtros?.tipo,
      procesoId: filtros?.procesoId,
    },
  });

  return items.map((i) => ({
    id: i.id,
    title: i.title,
    startDate: i.startDate,
    endDate: i.endDate,
    eventType: i.eventType,
    source: i.source as Actividad["source"],
    processId: i.processId,
    numeroProceso: i.numeroProceso,
    entidad: i.entidad,
    responsableUserId: i.responsableUserId,
    responsableNombre: i.responsableNombre,
    prioridad: i.prioridad,
    estado: i.estado as Actividad["estado"],
  }));
}
