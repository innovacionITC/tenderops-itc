import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listCalendar } from "@/lib/calendar";
import { clasificarCalendarioError } from "@/lib/errors/calendario";
import { CalendarView } from "./calendar-view";
import { CalendarioErrorBanner } from "./calendario-error-banner";
import { AbrirEnOutlookButton } from "./abrir-en-outlook-button";
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

  const sp = new URLSearchParams();
  if (params.vista) sp.set("vista", params.vista);
  if (params.fecha) sp.set("fecha", params.fecha);

  let resultado: Awaited<ReturnType<typeof listCalendar>> | null = null;
  let errorTipo: ReturnType<typeof clasificarCalendarioError> | null = null;

  try {
    resultado = await listCalendar(toIsoDate(desde), toIsoDate(hasta));
  } catch (e) {
    errorTipo = clasificarCalendarioError(e);
  }

  const header = (
    <PageHeader
      title="Calendario"
      description="Calendario compartido del equipo comercial (Outlook) y cierres SECOP."
      actions={resultado?.calendarioUrl ? <AbrirEnOutlookButton url={resultado.calendarioUrl} /> : undefined}
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
      <CalendarView
        eventos={resultado.eventos}
        initialView={vista as "month" | "week" | "day"}
        initialDate={fecha}
        searchParams={sp}
      />
    </>
  );
}
