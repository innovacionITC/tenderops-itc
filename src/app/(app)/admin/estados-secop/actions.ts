"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

// Errores de negocio (409/404) llegan de la API con `detail` en español y
// burbujean como message; la auditoría también vive en la API. El alta se
// hace con quickAddEstadoSecop() (../parametrica/actions.ts) desde el picker
// de "Estados SECOP" en Filtros de catálogo.

export async function deleteEstadoSecop(id: string) {
  await requireAuth(["administrador"]);
  const estadoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/estados-secop/${estadoId}`, { method: "DELETE" });
  revalidatePath("/admin/parametricas");
  return { ok: true };
}
