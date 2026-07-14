import "server-only";
import { and, asc, eq, gte, isNotNull, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents, secopProcesses, tasks } from "@/db/schema/schema";

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
        id: calendarEvents.id,
        title: calendarEvents.title,
        startDate: calendarEvents.startDate,
        endDate: calendarEvents.endDate,
        eventType: calendarEvents.eventType,
        processId: calendarEvents.processId,
      })
      .from(calendarEvents)
      .where(and(eq(calendarEvents.userId, userId), gte(calendarEvents.startDate, nowIso)))
      .orderBy(asc(calendarEvents.startDate)),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        processId: tasks.processId,
      })
      .from(tasks)
      .where(
        and(isNotNull(tasks.dueDate), ne(tasks.status, "completada"), gte(tasks.dueDate, nowIso)),
      )
      .orderBy(asc(tasks.dueDate))
      .limit(50),
    db
      .select({
        id: secopProcesses.id,
        title: secopProcesses.title,
        closingDate: secopProcesses.closingDate,
      })
      .from(secopProcesses)
      .where(
        and(
          eq(secopProcesses.status, "publicado"),
          isNotNull(secopProcesses.closingDate),
          gte(secopProcesses.closingDate, nowIso),
          lte(secopProcesses.closingDate, horizonIso),
        ),
      )
      .orderBy(asc(secopProcesses.closingDate))
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
