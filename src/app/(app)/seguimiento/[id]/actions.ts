"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

export async function cerrarSeguimiento(id: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const procesoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/procesos-seguimiento/${procesoId}/cerrar`, {
    method: "PATCH",
  });

  revalidatePath("/seguimiento");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
