import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { perfiles, procesosSecop, tareas, procesos } from "@/db/schema/schema";

export type TaskRow = {
  id: string;
  title: string;
  processId: string | null;
  processTitle: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: string | null;
  status: string | null;
  dueDate: string | null;
};

export async function listTasks(): Promise<TaskRow[]> {
  const rows = await db
    .select({
      id: tareas.id,
      title: tareas.titulo,
      processId: tareas.procesoId,
      assignedTo: tareas.asignadoA,
      priority: tareas.prioridad,
      status: tareas.estado,
      dueDate: tareas.fechaVencimiento,
    })
    .from(tareas)
    .orderBy(asc(tareas.fechaVencimiento));

  const processIds = Array.from(new Set(rows.map((t) => t.processId).filter((id) => id !== null)));
  const userIds = Array.from(new Set(rows.map((t) => t.assignedTo).filter((id) => id !== null)));

  const [processTitles, assignees] = await Promise.all([
    processIds.length
      ? db
          .select({ id: procesos.id, title: procesosSecop.titulo })
          .from(procesos)
          .innerJoin(procesosSecop, eq(procesos.procesoSecopId, procesosSecop.id))
          .where(inArray(procesos.id, processIds))
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({ id: perfiles.id, fullName: perfiles.nombreCompleto, email: perfiles.email })
          .from(perfiles)
          .where(inArray(perfiles.id, userIds))
      : Promise.resolve([]),
  ]);

  const processMap = new Map(processTitles.map((p) => [p.id, p.title]));
  const userMap = new Map(assignees.map((p) => [p.id, p.fullName ?? p.email ?? "—"]));

  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    processId: t.processId,
    processTitle: t.processId ? (processMap.get(t.processId) ?? null) : null,
    assignedTo: t.assignedTo,
    assignedToName: t.assignedTo ? (userMap.get(t.assignedTo) ?? null) : null,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
  }));
}
