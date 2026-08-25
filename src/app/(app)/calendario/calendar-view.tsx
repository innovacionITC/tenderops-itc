"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Calendar, Views, dateFnsLocalizer, type View } from "react-big-calendar";
import { es } from "date-fns/locale/es";
import { startOfWeek, getDay, parse, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import type { Actividad } from "@/lib/calendar";
import type { TaskRow } from "@/lib/tasks";
import { completeTask } from "./actions";
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

export function CalendarView({
  actividades,
  tasks,
  currentUserId,
  canManageAll,
  initialView,
  initialDate,
  searchParams,
}: {
  actividades: Actividad[];
  tasks: TaskRow[];
  currentUserId: string;
  canManageAll: boolean;
  initialView: View;
  initialDate: Date;
  searchParams: URLSearchParams;
}) {
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/calendario";
  const [isPending, startTransition] = useTransition();
  const [closingId, setClosingId] = useState<string | null>(null);
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
        title: a.title,
      })),
    [actividades],
  );

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      const { estado, source } = event.actividad;
      let className = "";
      if (estado === "vencida") className = "rbc-event-vencida";
      else if (estado === "proxima_a_vencer") className = "rbc-event-proxima";
      else if (estado === "completada") className = "rbc-event-completada";
      else if (source === "secop_closing") className = "rbc-event-secop";
      else if (source === "task") className = "rbc-event-tarea";
      else className = "rbc-event-evento";
      return { className };
    },
    [],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedActividad(event.actividad);
  }, []);

  const handleComplete = (taskId: string) => {
    setClosingId(taskId);
    startTransition(async () => {
      try {
        await completeTask(taskId);
        toast.success("Tarea cerrada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo cerrar la tarea");
      } finally {
        setClosingId(null);
      }
    });
  };

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
    <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_360px] lg:p-8">
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
            <span className="h-2 w-2 rounded-sm bg-destructive/60" /> Cierre SECOP
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-amber-500/60" /> Tarea
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-sky-500/60" /> Evento
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-500/60" /> Completada
          </span>
        </div>
      </div>

      <aside className="flex max-h-[calc(100vh-12rem)] flex-col rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Tareas del equipo</h2>
          <StatusBadge tone="muted">{tasks.length}</StatusBadge>
        </div>
        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {tasks.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Sin tareas registradas.</div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="rounded-xl border p-3 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.title}</div>
                      {t.processTitle && (
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {t.processTitle}
                        </div>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span>{t.assignedToName ?? "Sin asignar"}</span>
                        {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <StatusBadge
                        tone={
                          t.priority === "alta" ? "danger"
                            : t.priority === "media" ? "warning"
                            : "muted"
                        }
                      >
                        {t.priority ?? "—"}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          t.status === "completada" ? "success"
                            : t.status === "vencida" ? "danger"
                            : "info"
                        }
                      >
                        {t.status ?? "—"}
                      </StatusBadge>
                      {t.status !== "completada" &&
                        (t.assignedTo === currentUserId || canManageAll) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 h-7 px-2 text-[11px]"
                            disabled={isPending && closingId === t.id}
                            onClick={() => handleComplete(t.id)}
                          >
                            {isPending && closingId === t.id ? (
                              <Spinner className="h-3 w-3" />
                            ) : (
                              <>
                                <Check className="mr-1 h-3 w-3" /> Cerrar
                              </>
                            )}
                          </Button>
                        )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {selectedActividad && (
        <ActividadDetalleModal
          actividad={selectedActividad}
          onClose={() => setSelectedActividad(null)}
        />
      )}
    </div>
  );
}
