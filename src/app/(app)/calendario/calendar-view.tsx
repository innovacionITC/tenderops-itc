"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Views, dateFnsLocalizer, type View } from "react-big-calendar";
import { es } from "date-fns/locale/es";
import { startOfWeek, getDay, parse, format } from "date-fns";
import type { Actividad } from "@/lib/calendar";
import { ActividadDetalleModal } from "./actividad-detalle-modal";

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
  actividad: Actividad;
  start: Date;
  end: Date;
  title: string;
};

const CALENDARIO_MENSAJE_VACIO =
  "No existen actividades programadas para el período seleccionado.";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// El título completo ya se ve en el modal de detalle (ActividadDetalleModal):
// en la grilla basta un texto corto, así las columnas del calendario no
// necesitan ensancharse para mostrarlo completo.
const TITULO_GRILLA_MAX = 26;
function toTituloGrilla(title: string): string {
  return title.length > TITULO_GRILLA_MAX
    ? `${title.slice(0, TITULO_GRILLA_MAX - 1)}…`
    : title;
}

export function CalendarView({
  actividades,
  initialView,
  initialDate,
  searchParams,
}: {
  actividades: Actividad[];
  initialView: View;
  initialDate: Date;
  searchParams: URLSearchParams;
}) {
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/calendario";
  const [, startTransition] = useTransition();
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
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
      actividades.map((a) => ({
        actividad: a,
        start: new Date(a.startDate),
        end: a.endDate ? new Date(a.endDate) : new Date(a.startDate),
        title: toTituloGrilla(a.title),
      })),
    [actividades],
  );

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const { estado } = event.actividad;
    let className = "";
    if (estado === "vencida") className = "rbc-event-vencida";
    else if (estado === "proxima_a_vencer") className = "rbc-event-proxima";
    else className = "rbc-event-pendiente";
    return { className };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedActividad(event.actividad);
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
    event: "Actividad",
    noEventsInRange: CALENDARIO_MENSAJE_VACIO,
    showMore: (total: number) => `+${total} más`,
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <Calendar<CalendarEvent>
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
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
            <span className="h-2 w-2 rounded-sm bg-destructive/60" /> Vencida
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-500/60" /> Próxima a vencer
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-sky-500/60" /> Pendiente
          </span>
        </div>
      </div>

      <ActividadDetalleModal
        actividad={selectedActividad}
        onClose={() => setSelectedActividad(null)}
      />
    </div>
  );
}
