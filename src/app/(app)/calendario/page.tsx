import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listCalendar, type CalendarioFiltros } from "@/lib/calendar";
import { listUsuariosAsignables } from "@/lib/usuarios-asignables";
import { listProcesosSeguimiento } from "@/lib/seguimiento";
import { clasificarCalendarioError } from "@/lib/errors/calendario";
import { CalendarView } from "./calendar-view";
import { CalendarioFiltrosBar, type CalendarioFiltrosState } from "./calendario-filtros";
import { CalendarioErrorBanner } from "./calendario-error-banner";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay,
} from "date-fns";

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

function computeDateRange(view: string, date: Date): { desde: Date; hasta: Date } {
  switch (view) {
    case "day":
      return { desde: startOfDay(date), hasta: endOfDay(date) };
    case "week":
      return { desde: startOfWeek(date, { weekStartsOn: 1 }), hasta: endOfWeek(date, { weekStartsOn: 1 }) };
    default:
      return { desde: startOfMonth(date), hasta: endOfMonth(date) };
  }
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAuth(["administrador", "director", "gestor"]);
  const params = await searchParams;

  const vista = params.vista ?? "month";
  const fecha = fromIsoDate(params.fecha) ?? new Date();
  const { desde, hasta } = computeDateRange(vista, fecha);

  const filtrosState: CalendarioFiltrosState = {
    responsableUserId: params.responsableUserId ?? "",
    estado: params.estado ?? "",
    tipo: params.tipo ?? "",
    procesoId: params.procesoId ?? "",
    fechaDesde: params.fechaDesde ?? "",
    fechaHasta: params.fechaHasta ?? "",
  };

  const apiFiltros: CalendarioFiltros = {
    fechaDesde: filtrosState.fechaDesde || toIsoDate(desde),
    fechaHasta: filtrosState.fechaHasta || toIsoDate(hasta),
    responsableUserId: filtrosState.responsableUserId || undefined,
    estado: filtrosState.estado || undefined,
    tipo: filtrosState.tipo || undefined,
    procesoId: filtrosState.procesoId || undefined,
  };

  const sp = new URLSearchParams();
  if (params.vista) sp.set("vista", params.vista);
  if (params.fecha) sp.set("fecha", params.fecha);
  if (params.responsableUserId) sp.set("responsableUserId", params.responsableUserId);
  if (params.estado) sp.set("estado", params.estado);
  if (params.tipo) sp.set("tipo", params.tipo);
  if (params.procesoId) sp.set("procesoId", params.procesoId);
  if (params.fechaDesde) sp.set("fechaDesde", params.fechaDesde);
  if (params.fechaHasta) sp.set("fechaHasta", params.fechaHasta);

  let resultado: {
    actividades: Awaited<ReturnType<typeof listCalendar>>;
    responsables: Awaited<ReturnType<typeof listUsuariosAsignables>>;
    procesos: Awaited<ReturnType<typeof listProcesosSeguimiento>>;
  } | null = null;
  let errorTipo: ReturnType<typeof clasificarCalendarioError> | null = null;

  try {
    const [actividades, responsables, procesos] = await Promise.all([
      listCalendar(apiFiltros),
      listUsuariosAsignables(),
      listProcesosSeguimiento(),
    ]);
    resultado = { actividades, responsables, procesos };
  } catch (e) {
    errorTipo = clasificarCalendarioError(e);
  }

  const header = (
    <PageHeader
      title="Calendario"
      description="Vista día/semana/mes de eventos y cierres SECOP."
    />
  );

  if (errorTipo || !resultado) {
    return (
      <>
        {header}
        <div className="px-4 sm:px-6 lg:px-8">
          <CalendarioErrorBanner tipo={errorTipo ?? "error_consulta"} />
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="px-4 pb-2 sm:px-6 lg:px-8">
        <CalendarioFiltrosBar
          filtros={filtrosState}
          responsables={resultado.responsables}
          procesos={resultado.procesos}
        />
      </div>
      <CalendarView
        actividades={resultado.actividades}
        initialView={vista as "month" | "week" | "day"}
        initialDate={fecha}
        searchParams={sp}
      />
    </>
  );
}
