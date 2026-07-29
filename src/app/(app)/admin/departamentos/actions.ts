"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

// Errores de negocio (409/404) llegan de la API con `detail` en español y
// burbujean como message; la auditoría también vive en la API.

function revalidateUbicaciones() {
  revalidatePath("/admin/parametricas");
}

export async function createDepartamento(input: { nombre: string }) {
  await requireAuth(["administrador"]);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  await apiFetch<unknown>("/departamentos", { method: "POST", body: { name: nombre } });
  revalidateUbicaciones();
  return { ok: true };
}

export async function updateDepartamento(id: string, input: { nombre: string }) {
  await requireAuth(["administrador"]);
  const departamentoId = z.uuid().parse(id);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  await apiFetch<unknown>(`/departamentos/${departamentoId}`, {
    method: "PUT",
    body: { name: nombre },
  });
  revalidateUbicaciones();
  return { ok: true };
}

export async function setDepartamentoEstado(id: string, estado: boolean) {
  await requireAuth(["administrador"]);
  const departamentoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/departamentos/${departamentoId}/estado`, {
    method: "PATCH",
    body: { isActive: estado },
  });
  revalidateUbicaciones();
  return { ok: true };
}

export async function deleteDepartamento(id: string) {
  await requireAuth(["administrador"]);
  const departamentoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/departamentos/${departamentoId}`, { method: "DELETE" });
  revalidateUbicaciones();
  return { ok: true };
}
