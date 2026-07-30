"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { ciudadSchema } from "./schema";

// Errores de negocio (409 duplicada, 422 departamento inexistente, 404) llegan
// de la API con `detail` en español y burbujean como message.

function revalidateUbicaciones() {
  revalidatePath("/admin/parametricas");
}

export async function createCiudad(input: { nombre: string; departamentoId: string }) {
  await requireAuth(["administrador"]);
  const data = ciudadSchema.parse(input);

  await apiFetch<unknown>("/ciudades", {
    method: "POST",
    body: { name: data.nombre, departmentId: data.departamentoId },
  });
  revalidateUbicaciones();
  return { ok: true };
}

export async function updateCiudad(id: string, input: { nombre: string; departamentoId: string }) {
  await requireAuth(["administrador"]);
  const ciudadId = z.uuid().parse(id);
  const data = ciudadSchema.parse(input);

  await apiFetch<unknown>(`/ciudades/${ciudadId}`, {
    method: "PUT",
    body: { name: data.nombre, departmentId: data.departamentoId },
  });
  revalidateUbicaciones();
  return { ok: true };
}

export async function setCiudadEstado(id: string, estado: boolean) {
  await requireAuth(["administrador"]);
  const ciudadId = z.uuid().parse(id);

  await apiFetch<unknown>(`/ciudades/${ciudadId}/estado`, {
    method: "PATCH",
    body: { isActive: estado },
  });
  revalidateUbicaciones();
  return { ok: true };
}

export async function deleteCiudad(id: string) {
  await requireAuth(["administrador"]);
  const ciudadId = z.uuid().parse(id);

  await apiFetch<unknown>(`/ciudades/${ciudadId}`, { method: "DELETE" });
  revalidateUbicaciones();
  return { ok: true };
}
