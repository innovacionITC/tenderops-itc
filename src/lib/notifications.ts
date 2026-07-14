"use server";

import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

export async function listNotifications() {
  const { userId } = await requireAuth();
  return db
    .select({
      id: notifications.id,
      title: notifications.title,
      message: notifications.message,
      type: notifications.type,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: string) {
  const { userId } = await requireAuth();
  const notificationId = z.uuid().parse(id);

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

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
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  await recordAudit(userId, { action: "notification.mark_all_read", module: "notificaciones" });
  return { ok: true };
}
