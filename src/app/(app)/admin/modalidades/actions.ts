"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

// Errores de negocio (409/404) llegan de la API con `detail` en español y
// burbujean como message; la auditoría también vive en la API.

function revalidateModalidades() {
  revalidatePath("/admin/parametricas");
}

export async function createModalidad(input: { descripcion: string; codigo?: string }) {
  await requireAuth(["administrador"]);
  const descripcion = z.string().trim().min(1).parse(input.descripcion);
  const codigo = input.codigo?.trim() || null;

  await apiFetch<unknown>("/modalidades", {
    method: "POST",
    body: { description: descripcion, code: codigo },
  });
  revalidateModalidades();
  return { ok: true };
}

export async function updateModalidad(id: string, input: { descripcion: string; codigo?: string }) {
  await requireAuth(["administrador"]);
  const modalidadId = z.uuid().parse(id);
  const descripcion = z.string().trim().min(1).parse(input.descripcion);
  const codigo = input.codigo?.trim() || null;

  await apiFetch<unknown>(`/modalidades/${modalidadId}`, {
    method: "PUT",
    body: { description: descripcion, code: codigo },
  });
  revalidateModalidades();
  return { ok: true };
}

export async function setModalidadEstado(id: string, estado: boolean) {
  await requireAuth(["administrador"]);
  const modalidadId = z.uuid().parse(id);

  await apiFetch<unknown>(`/modalidades/${modalidadId}/estado`, {
    method: "PATCH",
    body: { isActive: estado },
  });
  revalidateModalidades();
  return { ok: true };
}

export async function deleteModalidad(id: string) {
  await requireAuth(["administrador"]);
  const modalidadId = z.uuid().parse(id);

  await apiFetch<unknown>(`/modalidades/${modalidadId}`, { method: "DELETE" });
  revalidateModalidades();
  return { ok: true };
}
