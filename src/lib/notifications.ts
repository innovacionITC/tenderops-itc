"use server";

import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificaciones } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

export async function listNotifications() {
  const { userId } = await requireAuth();
  return db
    .select({
      id: notificaciones.id,
      title: notificaciones.titulo,
      message: notificaciones.mensaje,
      type: notificaciones.tipo,
      isRead: notificaciones.leido,
      createdAt: notificaciones.fechaCreacion,
    })
    .from(notificaciones)
    .where(eq(notificaciones.usuarioId, userId))
    .orderBy(desc(notificaciones.fechaCreacion))
    .limit(50);
}

export async function markNotificationRead(id: string) {
  const { userId } = await requireAuth();
  const notificationId = z.uuid().parse(id);

  await db
    .update(notificaciones)
    .set({ leido: true })
    .where(and(eq(notificaciones.id, notificationId), eq(notificaciones.usuarioId, userId)));

  await recordAudit(userId, {
    action: "notification.mark_read",
    module: "notificaciones",
    entityType: "notification",
    entityId: notificationId,
  });
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const { userId } = await requireAuth();

  await db
    .update(notificaciones)
    .set({ leido: true })
    .where(and(eq(notificaciones.usuarioId, userId), eq(notificaciones.leido, false)));

  await recordAudit(userId, { action: "notification.mark_all_read", module: "notificaciones" });
  return { ok: true };
}
