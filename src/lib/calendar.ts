import "server-only";
import { apiFetch } from "@/lib/api/client";

export type EventoCalendario = {
  id: string;
  titulo: string;
  inicio: string;
  fin: string;
  todoElDia: boolean;
  origen: "dynamics" | "outlook" | "cierre_secop";
  cancelado: boolean;
  esRecurrente: boolean;
  ubicacion: string | null;
  organizador: string | null;
  asistentes: string[];
  urlReunion: string | null;
  webLink: string | null;
  oportunidadNombre: string | null;
  procesoId: string | null;
  numeroProceso: string | null;
  entidad: string | null;
};

type CalendarioResponse = {
  calendarioUrl: string | null;
  eventos: EventoCalendario[];
};

export async function listCalendar(
  fechaDesde: string,
  fechaHasta: string,
): Promise<{ calendarioUrl: string | null; eventos: EventoCalendario[] }> {
  const result = await apiFetch<CalendarioResponse>("/calendario", {
    query: { fechaDesde, fechaHasta },
  });

  return {
    calendarioUrl: result.calendarioUrl,
    eventos: result.eventos,
  };
}
