"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { nitSchema } from "./schema";

// Errores de negocio (409/404) llegan de la API con `detail` en español y
// burbujean como message; la auditoría también vive en la API.

function revalidateNits() {
  revalidatePath("/admin/parametricas");
}

export async function createNit(input: { nit: string; descripcion: string }) {
  await requireAuth(["administrador"]);
  const { nit, descripcion } = nitSchema.parse(input);

  await apiFetch<unknown>("/nits", { method: "POST", body: { nit, description: descripcion } });
  revalidateNits();
  return { ok: true };
}

export async function updateNit(id: string, input: { nit: string; descripcion: string }) {
  await requireAuth(["administrador"]);
  const nitId = z.uuid().parse(id);
  const { nit, descripcion } = nitSchema.parse(input);

  await apiFetch<unknown>(`/nits/${nitId}`, {
    method: "PUT",
    body: { nit, description: descripcion },
  });
  revalidateNits();
  return { ok: true };
}

export async function setNitEstado(id: string, estado: boolean) {
  await requireAuth(["administrador"]);
  const nitId = z.uuid().parse(id);

  await apiFetch<unknown>(`/nits/${nitId}/estado`, {
    method: "PATCH",
    body: { isActive: estado },
  });
  revalidateNits();
  return { ok: true };
}

export async function deleteNit(id: string) {
  await requireAuth(["administrador"]);
  const nitId = z.uuid().parse(id);

  await apiFetch<unknown>(`/nits/${nitId}`, { method: "DELETE" });
  revalidateNits();
  return { ok: true };
}
