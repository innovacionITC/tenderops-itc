"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { unspscSchema } from "./schema";

// Errores de negocio (409 código duplicado, 404) llegan de la API con
// `detail` en español y burbujean como message.

function revalidateUnspsc() {
  revalidatePath("/admin/parametricas");
}

export async function createUnspscCode(input: { codigo: string; descripcion: string }) {
  await requireAuth(["administrador"]);
  const { codigo, descripcion } = unspscSchema.parse(input);

  await apiFetch<unknown>("/codigos-unspsc", {
    method: "POST",
    body: { code: codigo, description: descripcion },
  });
  revalidateUnspsc();
  return { ok: true };
}

export async function updateUnspscCode(id: string, input: { codigo: string; descripcion: string }) {
  await requireAuth(["administrador"]);
  const codeId = z.uuid().parse(id);
  const { codigo, descripcion } = unspscSchema.parse(input);

  await apiFetch<unknown>(`/codigos-unspsc/${codeId}`, {
    method: "PUT",
    body: { code: codigo, description: descripcion },
  });
  revalidateUnspsc();
  return { ok: true };
}

export async function deleteUnspscCode(id: string) {
  await requireAuth(["administrador"]);
  const codeId = z.uuid().parse(id);

  await apiFetch<unknown>(`/codigos-unspsc/${codeId}`, { method: "DELETE" });
  revalidateUnspsc();
  return { ok: true };
}
