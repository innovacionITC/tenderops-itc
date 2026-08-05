"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { buscarEnVivo } from "@/lib/secop";
import type { ApiSchemas } from "@/lib/api/types";

type TriggerSyncResponse = ApiSchemas["TriggerSyncResponse"];

export async function sincronizarSecop() {
  await requireAuth(["administrador"]);

  const res = await apiFetch<TriggerSyncResponse>("/secop/sincronizar", { method: "POST" });

  revalidatePath("/secop");

  return { ok: true as const, jobIdSecopI: res.jobIdSecopI, jobIdSecopIi: res.jobIdSecopIi };
}

export async function promoverProceso(id: string) {
  await requireAuth();
  const procesoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/secop/procesos/${procesoId}/promover`, { method: "PATCH" });

  revalidatePath("/secop");
  revalidatePath("/seguimiento");
  return { ok: true as const };
}

export async function descartarProceso(id: string, motivo?: string) {
  await requireAuth();
  const procesoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/secop/procesos/${procesoId}/descartar`, {
    method: "PATCH",
    body: { motivo: motivo ?? null },
  });

  revalidatePath("/secop");
  return { ok: true as const };
}

export async function buscarEnVivoAction(params: {
  dataset: string;
  entidad?: string;
  nit?: string;
  objeto?: string;
  modalidad?: string;
  estado?: string;
  cuantiaMin?: number;
  cuantiaMax?: number;
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();

  // Sin revalidatePath: esta acción no persiste nada, solo consulta Socrata
  // en vivo (ver ISecopLiveSearchThrottle en el backend, que limita cuántas
  // veces por organización se puede llamar en un lapso corto).
  return buscarEnVivo(params);
}
