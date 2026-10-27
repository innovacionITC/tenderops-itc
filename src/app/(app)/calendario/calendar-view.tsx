"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Views, dateFnsLocalizer, type EventProps, type View } from "react-big-calendar";
import { es } from "date-fns/locale/es";
import { startOfWeek, getDay, parse, format } from "date-fns";
import { Repeat } from "lucide-react";
import type { EventoCalendario } from "@/lib/calendar";
import { EventoDetalleModal } from "./evento-detalle-modal";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type CalendarEvent = {
  evento: EventoCalendario;
  start: Date;
  end: Date;
  title: string;
};

const CALENDARIO_MENSAJE_VACIO =
  "No hay eventos en el calendario del equipo para este período.";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// El título completo ya se ve en el modal de detalle (EventoDetalleModal) y en
// el tooltip: en la grilla basta un texto corto, así las columnas del
// calendario no necesitan ensancharse para mostrarlo completo.
const TITULO_GRILLA_MAX = 26;
function toTituloGrilla(title: string): string {
  return title.length > TITULO_GRILLA_MAX
    ? `${title.slice(0, TITULO_GRILLA_MAX - 1)}…`
    : title;
}

// `title` se queda como texto porque react-big-calendar lo usa también como
// tooltip (atributo HTML title); el ícono de recurrencia se pinta aquí.
function EventoGrilla({ event }: EventProps<CalendarEvent>) {
  return (
    <span className="inline-flex items-center gap-1">
      {toTituloGrilla(event.title)}
      {event.evento.esRecurrente && <Repeat className="h-3 w-3 shrink-0 opacity-60" />}
    </span>
  );
}

const CALENDAR_COMPONENTS = { event: EventoGrilla };

export function CalendarView({
  eventos,
  initialView,
  initialDate,
  searchParams,
}: {
  eventos: EventoCalendario[];
  initialView: View;
  initialDate: Date;
  searchParams: URLSearchParams;
}) {
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/calendario";
  const [, startTransition] = useTransition();
  const [selectedEvento, setSelectedEvento] = useState<EventoCalendario | null>(null);
  const [currentView, setCurrentView] = useState<View>(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate);

  const navigateTo = useCallback(
    (view: View, date: Date) => {
      const qs = new URLSearchParams(searchParams.toString());
      qs.set("vista", view);
      qs.set("fecha", toIsoDate(date));
      startTransition(() => {
        router.push(`${pathname}?${qs}`);
      });
    },
    [router, pathname, searchParams],
  );

  const handleNavigate = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      navigateTo(currentView, date);
    },
    [currentView, navigateTo],
  );

  const handleViewChange = useCallback(
    (view: View) => {
      setCurrentView(view);
      navigateTo(view, currentDate);
    },
    [currentDate, navigateTo],
  );

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      eventos.map((e) => ({
        evento: e,
        start: new Date(e.inicio),
        end: new Date(e.fin),
        title: e.titulo,
      })),
    [eventos],
  );

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const { origen, cancelado } = event.evento;
    let className = "";
    if (cancelado) className = "rbc-event-cancelado";
    else if (origen === "dynamics") className = "rbc-event-dynamics";
    else if (origen === "outlook") className = "rbc-event-outlook";
    else className = "rbc-event-secop";
    return { className };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvento(event.evento);
  }, []);

  const messages = {
    allDay: "Todo el día",
    previous: "Anterior",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: CALENDARIO_MENSAJE_VACIO,
    showMore: (total: number) => `+${total} más`,
  };

  return (
    <div className="page-body grid grid-cols-1 gap-4">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <Calendar<CalendarEvent>
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          allDayAccessor={(e: CalendarEvent) => e.evento.todoElDia}
          components={CALENDAR_COMPONENTS}
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          eventPropGetter={eventPropGetter}
          onSelectEvent={handleSelectEvent}
          messages={messages}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          culture="es"
          style={{ height: "calc(100vh - 14rem)" }}
        />
        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-violet-500/70" /> Cita Dynamics
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-sky-500/70" /> Evento Outlook
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-500/60" /> Cierre SECOP
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/30" /> Cancelado
          </span>
        </div>
      </div>

      <EventoDetalleModal
        evento={selectedEvento}
        onClose={() => setSelectedEvento(null)}
      />
    </div>
  );
}
