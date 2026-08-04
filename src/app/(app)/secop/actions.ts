"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import type { ApiSchemas } from "@/lib/api/types";

type TriggerSyncResponse = ApiSchemas["TriggerSyncResponse"];

/**
 * Encola una corrida manual de la ingesta (SECOP I y II) para la organización
 * activa. La API responde apenas los jobs quedan en cola — no espera a que
 * terminen —, así que la tabla no tendrá resultados nuevos de inmediato.
 */
export async function sincronizarSecop() {
  await requireAuth(["administrador"]);

  const res = await apiFetch<TriggerSyncResponse>("/secop/sincronizar", { method: "POST" });

  revalidatePath("/secop");

  return { ok: true as const, jobIdSecopI: res.jobIdSecopI, jobIdSecopIi: res.jobIdSecopIi };
}
