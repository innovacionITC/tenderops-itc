"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

const claveSchema = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]*$/, "Usa MAYÚSCULAS_CON_GUION_BAJO");

// Clave duplicada → 409 (credencial_duplicada) y 404 real llegan de la API
// con `detail` en español y burbujean como message.

export async function createCredential(input: {
  clave: string;
  valor: string;
  descripcion?: string;
}) {
  await requireAuth(["administrador"]);
  const clave = claveSchema.parse(input.clave);
  const valor = z.string().trim().min(1).parse(input.valor);
  const descripcion = input.descripcion?.trim() || null;

  await apiFetch<unknown>("/credenciales", {
    method: "POST",
    body: { key: clave, value: valor, description: descripcion },
  });

  revalidatePath("/admin/credenciales");
  return { ok: true };
}

export async function updateCredential(
  id: string,
  input: { valor?: string; descripcion?: string },
) {
  await requireAuth(["administrador"]);
  const credentialId = z.uuid().parse(id);

  // Contrato heredado: el valor solo se reescribe si llega no-vacío; la
  // descripción se reescribe siempre.
  await apiFetch<unknown>(`/credenciales/${credentialId}`, {
    method: "PUT",
    body: { value: input.valor?.trim() || null, description: input.descripcion?.trim() || null },
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
