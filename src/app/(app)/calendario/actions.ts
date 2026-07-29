"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import { requireAuth } from "@/lib/auth/session";

export async function completeTask(taskId: string) {
  await requireAuth();
  const id = z.uuid().parse(taskId);

  // La regla "solo quien la tiene asignada, o admin/director" vive en la API:
  // 403 (tarea_no_asignada) / 404 llegan con `detail` en español y burbujean.
  // Ya completada → { ok: true, already: true }, idempotente.
  const result = await apiFetch<ApiSchemas["CompleteTareaResponse"]>(`/tareas/${id}/completar`, {
    method: "POST",
  });

  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return result.already ? { ok: true, already: true } : { ok: true };
}
