import "server-only";
import { and, asc, eq, gte, isNotNull, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { eventosCalendario, procesosSecop, tareas } from "@/db/schema/schema";

export type CalendarItem = {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  eventType: string | null;
  source: "event" | "task" | "secop_closing";
  processId: string | null;
};

export async function listCalendar(userId: string): Promise<CalendarItem[]> {
  const nowIso = new Date().toISOString();
  const horizonIso = new Date(Date.now() + 90 * 86_400_000).toISOString();

  const [events, dueTasks, closingProcesses] = await Promise.all([
    db
      .select({
        id: eventosCalendario.id,
        title: eventosCalendario.titulo,
        startDate: eventosCalendario.fechaInicio,
        endDate: eventosCalendario.fechaFin,
        eventType: eventosCalendario.tipoEvento,
        processId: eventosCalendario.procesoId,
      })
      .from(eventosCalendario)
      .where(
        and(eq(eventosCalendario.usuarioId, userId), gte(eventosCalendario.fechaInicio, nowIso)),
      )
      .orderBy(asc(eventosCalendario.fechaInicio)),
    db
      .select({
        id: tareas.id,
        title: tareas.titulo,
        dueDate: tareas.fechaVencimiento,
        processId: tareas.procesoId,
      })
      .from(tareas)
      .where(
        and(
          isNotNull(tareas.fechaVencimiento),
          ne(tareas.estado, "completada"),
          gte(tareas.fechaVencimiento, nowIso),
        ),
      )
      .orderBy(asc(tareas.fechaVencimiento))
      .limit(50),
    db
      .select({
        id: procesosSecop.id,
        title: procesosSecop.titulo,
        closingDate: procesosSecop.fechaCierre,
      })
      .from(procesosSecop)
      .where(
        and(
          eq(procesosSecop.estado, "publicado"),
          isNotNull(procesosSecop.fechaCierre),
          gte(procesosSecop.fechaCierre, nowIso),
          lte(procesosSecop.fechaCierre, horizonIso),
        ),
      )
      .orderBy(asc(procesosSecop.fechaCierre))
      .limit(50),
  ]);

  const items: CalendarItem[] = [
    ...events.map((e) => ({
      id: `e-${e.id}`,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      eventType: e.eventType,
      source: "event" as const,
      processId: e.processId,
    })),
    ...dueTasks.map((t) => ({
      id: `t-${t.id}`,
      title: t.title,
      startDate: t.dueDate!,
      endDate: null,
      eventType: "tarea",
      source: "task" as const,
      processId: t.processId,
    })),
    ...closingProcesses.map((s) => ({
      id: `s-${s.id}`,
      title: `Cierre: ${s.title}`,
      startDate: s.closingDate!,
      endDate: null,
      eventType: "cierre_secop",
      source: "secop_closing" as const,
      processId: null,
    })),
  ];

  return items.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
