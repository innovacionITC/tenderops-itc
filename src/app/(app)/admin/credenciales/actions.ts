"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { credentialCreateSchema, credentialUpdateSchema } from "./schema";

// Clave duplicada → 409 (credencial_duplicada) y 404 real llegan de la API
// con `detail` en español y burbujean como message.

export async function createCredential(input: { clave: string; valor: string; descripcion: string }) {
  await requireAuth(["administrador"]);
  const { clave, valor, descripcion } = credentialCreateSchema.parse(input);

  await apiFetch<unknown>("/credenciales", {
    method: "POST",
    body: { key: clave, value: valor, description: descripcion },
  });

  revalidatePath("/admin/credenciales");
  return { ok: true };
}

export async function updateCredential(id: string, input: { valor?: string; descripcion: string }) {
  await requireAuth(["administrador"]);
  const credentialId = z.uuid().parse(id);
  const { valor, descripcion } = credentialUpdateSchema.parse(input);

  // El valor solo se reescribe si llega no-vacío (ver schema.ts); la
  // descripción se reescribe siempre porque ahora es obligatoria.
  await apiFetch<unknown>(`/credenciales/${credentialId}`, {
    method: "PUT",
    body: { value: valor?.trim() || null, description: descripcion },
  });

  revalidatePath("/admin/credenciales");
  return { ok: true };
}

export async function deleteCredential(id: string) {
  await requireAuth(["administrador"]);
  const credentialId = z.uuid().parse(id);

  await apiFetch<unknown>(`/credenciales/${credentialId}`, { method: "DELETE" });

  revalidatePath("/admin/credenciales");
  return { ok: true };
}
