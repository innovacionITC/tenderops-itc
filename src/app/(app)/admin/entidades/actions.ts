"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { entidadSchema } from "./schema";

// Los errores de negocio (409 nombre duplicado, 404 id inexistente) llegan de
// la API como ProblemDetails con `detail` en español; ApiError los expone como
// `message` y burbujean tal cual a la UI. La auditoría también vive en la API.

function revalidateEntidades() {
  revalidatePath("/admin/parametricas");
  revalidatePath("/secop");
}

export async function createEntidad(input: { nombre: string }) {
  await requireAuth(["administrador"]);
  const { nombre } = entidadSchema.parse(input);

  await apiFetch<unknown>("/entidades", { method: "POST", body: { name: nombre } });
  revalidateEntidades();
  return { ok: true };
}

export async function updateEntidad(id: string, input: { nombre: string }) {
  await requireAuth(["administrador"]);
  const entidadId = z.uuid().parse(id);
  const { nombre } = entidadSchema.parse(input);

  await apiFetch<unknown>(`/entidades/${entidadId}`, { method: "PUT", body: { name: nombre } });
  revalidateEntidades();
  return { ok: true };
}

export async function setEntidadEstado(id: string, estado: boolean) {
  await requireAuth(["administrador"]);
  const entidadId = z.uuid().parse(id);

  await apiFetch<unknown>(`/entidades/${entidadId}/estado`, {
    method: "PATCH",
    body: { isActive: estado },
  });
  revalidateEntidades();
  return { ok: true };
}

export async function deleteEntidad(id: string) {
  await requireAuth(["administrador"]);
  const entidadId = z.uuid().parse(id);

  await apiFetch<unknown>(`/entidades/${entidadId}`, { method: "DELETE" });
  revalidateEntidades();
  return { ok: true };
}

export async function setEntidadMonitoreo(id: string, monitoreo: boolean) {
  await requireAuth(["administrador"]);
  const entidadId = z.uuid().parse(id);

  await apiFetch<unknown>(`/entidades/${entidadId}/monitoreo`, {
    method: "PATCH",
    body: { isMonitored: monitoreo },
  });
  revalidateEntidades();
  return { ok: true };
}
