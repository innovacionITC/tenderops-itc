"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import type { CalendarItem } from "@/lib/calendar";
import type { TaskRow } from "@/lib/tasks";
import { completeTask } from "./actions";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function CalendarView({
  events,
  tasks,
  currentUserId,
  canManageAll,
}: {
  events: CalendarItem[];
  tasks: TaskRow[];
  currentUserId: string;
  canManageAll: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [closingId, setClosingId] = useState<string | null>(null);

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const ev of events) {
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(ev);
    }
    return m;
  }, [events]);

  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(cursor.year, cursor.month, d),
        key: `${cursor.year}-${cursor.month}-${d}`,
      });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, key: `tail-${cells.length}` });
    return cells;
  }, [cursor]);

  const move = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      const year = c.year + Math.floor(m / 12);
      const month = ((m % 12) + 12) % 12;
      return { year, month };
    });
  };

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

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

  return (
    <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_360px] lg:p-8">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">
            {MONTHS[cursor.month]} {cursor.year}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => move(-1)}
              className="rounded p-1.5 hover:bg-muted/50"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}
              className="rounded px-2 py-1 text-xs hover:bg-muted/50"
            >
              Hoy
            </button>
            <button
              onClick={() => move(1)}
              className="rounded p-1.5 hover:bg-muted/50"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-[11px] font-medium text-muted-foreground">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="py-1 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell) => {
            if (!cell.date)
              return <div key={cell.key} className="min-h-[88px] rounded-md bg-muted/20" />;
            const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
            const dayEvents = eventsByDay.get(key) ?? [];
            return (
              <div
                key={cell.key}
                className={`flex min-h-[88px] flex-col gap-1 rounded-md border p-1.5 ${isToday(cell.date) ? "ring-2 ring-primary" : ""}`}
              >
                <div className="text-[11px] font-medium text-muted-foreground">
                  {cell.date.getDate()}
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      title={ev.title}
                      className={`truncate rounded px-1 py-0.5 text-[10px] ${
                        ev.source === "secop_closing"
                          ? "bg-destructive/15 text-destructive"
                          : ev.source === "task"
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                            : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                          t.priority === "alta"
                            ? "danger"
                            : t.priority === "media"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {t.priority ?? "—"}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          t.status === "completada"
                            ? "success"
                            : t.status === "vencida"
                              ? "danger"
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
                              <Loader2 className="h-3 w-3 animate-spin" />
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
    </div>
  );
}
