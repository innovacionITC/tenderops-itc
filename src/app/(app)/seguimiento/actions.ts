"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

export async function marcarProceso(
  id: string,
  resultado: string,
  motivo?: string,
  valorAdjudicado?: number,
  fechaAdjudicacion?: string,
) {
  await requireAuth(["administrador", "director", "gestor"]);
  const procesoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/procesos-seguimiento/${procesoId}/marcar`, {
    method: "PATCH",
    body: { resultado, motivo, valorAdjudicado, fechaAdjudicacion },
  });

  revalidatePath("/seguimiento");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
