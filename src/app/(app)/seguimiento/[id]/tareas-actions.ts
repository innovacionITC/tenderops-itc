"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

export async function crearTarea(input: {
  title: string;
  description?: string;
  processId: string;
  assignedTo?: string;
  priority?: string;
  dueAt?: string;
}) {
  await requireAuth(["administrador", "director", "gestor"]);

  await apiFetch<unknown>("/tareas", {
    method: "POST",
    body: {
      title: input.title,
      description: input.description ?? null,
      processId: z.uuid().parse(input.processId),
      assignedTo: input.assignedTo ? z.uuid().parse(input.assignedTo) : null,
      priority: input.priority ?? null,
      dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null,
    },
  });

  revalidatePath(`/seguimiento/${input.processId}`);
  revalidatePath("/seguimiento");
  revalidatePath("/calendario");
  return { ok: true as const };
}
