"use server";

import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import { requireAuth } from "@/lib/auth/session";

export async function listNotifications() {
  await requireAuth();
  const rows = await apiFetch<ApiSchemas["NotificacionResponse"][]>("/notificaciones");

  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));
}

export async function markNotificationRead(id: string) {
  await requireAuth();
  const notificationId = z.uuid().parse(id);

  // Nota: una notificación inexistente (o ajena) responde 404 real en la API
  // — el no-op silencioso del código Drizzle se consideró bug, no contrato.
  await apiFetch<void>(`/notificaciones/${notificationId}/leer`, { method: "POST" });
  return { ok: true };
}

export async function markAllNotificationsRead() {
  await requireAuth();
  await apiFetch<void>("/notificaciones/leer-todas", { method: "POST" });
  return { ok: true };
}
