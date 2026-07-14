import "server-only";
import { and, count, eq, gte, inArray, lt, lte, ne, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  aiEvaluations,
  detectedProcesses,
  secopProcesses,
  tasks,
  tenderopsProcesses,
  userProcessFollowups,
} from "@/db/schema/schema";

const TERMINAL_STATUSES = ["presentado", "descartado", "no_adjudicado", "adjudicado"] as const;

export async function getDashboard() {
  const now = new Date();
  const nowIso = now.toISOString();
  const in7DaysIso = new Date(now.getTime() + 7 * 86_400_000).toISOString();

  const activeFollows = await db
    .select({ processId: userProcessFollowups.processId })
    .from(userProcessFollowups)
    .where(eq(userProcessFollowups.isActive, true));
  const followedIds = Array.from(new Set(activeFollows.map((f) => f.processId)));

  const [
    [{ value: detectedCount }],
    [{ value: marketStudiesCount }],
    [{ value: pendingTasksCount }],
    [{ value: overdueCount }],
  ] = await Promise.all([
    db.select({ value: count() }).from(detectedProcesses),
    db
      .select({ value: count() })
      .from(aiEvaluations)
      .where(inArray(aiEvaluations.status, ["borrador", "en_proceso"])),
    db.select({ value: count() }).from(tasks).where(eq(tasks.status, "pendiente")),
    db
      .select({ value: count() })
      .from(tasks)
      .where(and(lt(tasks.dueDate, nowIso), ne(tasks.status, "completada"))),
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
      db.query.tenderopsProcesses.findMany({
        where: and(
          inArray(tenderopsProcesses.id, followedIds),
          notInArray(tenderopsProcesses.internalStatus, [...TERMINAL_STATUSES]),
        ),
        with: { secopProcess: true },
        limit: 10,
      }),
      db.query.tenderopsProcesses.findMany({
        where: and(
          inArray(tenderopsProcesses.id, followedIds),
          eq(tenderopsProcesses.internalStatus, "presentado"),
        ),
        with: { secopProcess: true },
        orderBy: (t, { desc }) => [desc(t.updatedAt)],
        limit: 10,
      }),
      db
        .select({ value: count() })
        .from(tenderopsProcesses)
        .innerJoin(secopProcesses, eq(tenderopsProcesses.secopProcessId, secopProcesses.id))
        .where(
          and(
            inArray(tenderopsProcesses.id, followedIds),
            notInArray(tenderopsProcesses.internalStatus, [...TERMINAL_STATUSES]),
            gte(secopProcesses.closingDate, nowIso),
            lte(secopProcesses.closingDate, in7DaysIso),
          ),
        ),
    ]);

    upcoming = upcomingRows
      .filter(
        (p) => p.secopProcess && p.secopProcess.closingDate && p.secopProcess.closingDate >= nowIso,
      )
      .sort((a, b) =>
        (a.secopProcess!.closingDate ?? "").localeCompare(b.secopProcess!.closingDate ?? ""),
      )
      .map((p) => ({
        id: p.id,
        secopTitle: p.secopProcess?.title ?? null,
        entityName: p.secopProcess?.entityName ?? null,
        closingDate: p.secopProcess?.closingDate ?? null,
      }));

    presented = presentedRows.map((p) => ({
      id: p.id,
      secopTitle: p.secopProcess?.title ?? null,
      secopId: p.secopProcess?.secopId ?? null,
      entityName: p.secopProcess?.entityName ?? null,
      estimatedValue: p.secopProcess?.estimatedValue ?? null,
      updatedAt: p.updatedAt,
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
