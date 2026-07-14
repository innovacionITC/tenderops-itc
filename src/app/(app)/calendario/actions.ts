"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { hasAnyRole } from "@/lib/auth/roles";
import { recordAudit } from "@/lib/audit";

export async function completeTask(taskId: string) {
  const { userId, role } = await requireAuth();
  const id = z.uuid().parse(taskId);

  const [task] = await db
    .select({ id: tasks.id, assignedTo: tasks.assignedTo, status: tasks.status })
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);

  if (!task) throw new Error("Tarea no encontrada");
  if (task.status === "completada") return { ok: true, already: true };

  if (
    task.assignedTo &&
    task.assignedTo !== userId &&
    !hasAnyRole(role, ["administrador", "director"])
  ) {
    throw new Error("Solo quien realizó la tarea puede cerrarla");
  }

  const now = new Date().toISOString();
  await db
    .update(tasks)
    .set({ status: "completada", completedAt: now, completedBy: userId })
    .where(eq(tasks.id, id));

  await recordAudit(userId, {
    action: "task.complete",
    module: "tareas",
    entityType: "task",
    entityId: id,
    metadata: { completed_at: now },
  });

  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { ok: true };
}
