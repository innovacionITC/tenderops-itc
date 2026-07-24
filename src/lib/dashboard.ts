import "server-only";
import { and, count, eq, gte, inArray, lt, lte, ne, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  evaluacionesIa,
  procesosDetectados,
  procesosSecop,
  tareas,
  procesos,
  seguimientosProceso,
} from "@/db/schema/schema";

const TERMINAL_STATUSES = ["presentado", "descartado", "no_adjudicado", "adjudicado"] as const;

export async function getDashboard() {
  const now = new Date();
  const nowIso = now.toISOString();
  const in7DaysIso = new Date(now.getTime() + 7 * 86_400_000).toISOString();

  const activeFollows = await db
    .select({ processId: seguimientosProceso.procesoId })
    .from(seguimientosProceso)
    .where(eq(seguimientosProceso.activo, true));
  const followedIds = Array.from(new Set(activeFollows.map((f) => f.processId)));

  const [
    [{ value: detectedCount }],
    [{ value: marketStudiesCount }],
    [{ value: pendingTasksCount }],
    [{ value: overdueCount }],
  ] = await Promise.all([
    db.select({ value: count() }).from(procesosDetectados),
    db
      .select({ value: count() })
      .from(evaluacionesIa)
      .where(inArray(evaluacionesIa.estado, ["borrador", "en_proceso"])),
    db.select({ value: count() }).from(tareas).where(eq(tareas.estado, "pendiente")),
    db
      .select({ value: count() })
      .from(tareas)
      .where(and(lt(tareas.fechaVencimiento, nowIso), ne(tareas.estado, "completada"))),
  ]);

  let upcoming: Array<{
    id: string;
    secopTitle: string | null;
    entityName: string | null;
    closingDate: string | null;
  }> = [];
  let presented: Array<{
    id: string;
    secopTitle: string | null;
    secopId: string | null;
    entityName: string | null;
    estimatedValue: string | null;
    updatedAt: string;
  }> = [];
  let upcoming7 = 0;

  if (followedIds.length > 0) {
    const [upcomingRows, presentedRows, [{ value: upcoming7Count }]] = await Promise.all([
      db.query.procesos.findMany({
        where: and(
          inArray(procesos.id, followedIds),
          notInArray(procesos.estadoInterno, [...TERMINAL_STATUSES]),
        ),
        with: { procesosSecop: true },
        limit: 10,
      }),
      db.query.procesos.findMany({
        where: and(
          inArray(procesos.id, followedIds),
          eq(procesos.estadoInterno, "presentado"),
        ),
        with: { procesosSecop: true },
        orderBy: (t, { desc }) => [desc(t.fechaModificacion)],
        limit: 10,
      }),
      db
        .select({ value: count() })
        .from(procesos)
        .innerJoin(procesosSecop, eq(procesos.procesoSecopId, procesosSecop.id))
        .where(
          and(
            inArray(procesos.id, followedIds),
            notInArray(procesos.estadoInterno, [...TERMINAL_STATUSES]),
            gte(procesosSecop.fechaCierre, nowIso),
            lte(procesosSecop.fechaCierre, in7DaysIso),
          ),
        ),
    ]);

    upcoming = upcomingRows
      .filter(
        (p) =>
          p.procesosSecop && p.procesosSecop.fechaCierre && p.procesosSecop.fechaCierre >= nowIso,
      )
      .sort((a, b) =>
        (a.procesosSecop!.fechaCierre ?? "").localeCompare(b.procesosSecop!.fechaCierre ?? ""),
      )
      .map((p) => ({
        id: p.id,
        secopTitle: p.procesosSecop?.titulo ?? null,
        entityName: p.procesosSecop?.nombreEntidad ?? null,
        closingDate: p.procesosSecop?.fechaCierre ?? null,
      }));

    presented = presentedRows.map((p) => ({
      id: p.id,
      secopTitle: p.procesosSecop?.titulo ?? null,
      secopId: p.procesosSecop?.secopId ?? null,
      entityName: p.procesosSecop?.nombreEntidad ?? null,
      estimatedValue: p.procesosSecop?.valorEstimado ?? null,
      updatedAt: p.fechaModificacion,
    }));
    upcoming7 = upcoming7Count;
  }

  return {
    counts: {
      total: detectedCount,
      followed: followedIds.length,
      upcoming7,
      marketStudies: marketStudiesCount,
      pendingTasks: pendingTasksCount,
      overdueTasks: overdueCount,
    },
    upcoming,
    presented,
  };
}
