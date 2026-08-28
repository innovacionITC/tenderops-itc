"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { suborganizacionSchema } from "./schema";

function revalidateSuborganizaciones() {
  revalidatePath("/admin/parametricas");
  revalidatePath("/indicadores");
}

export async function createSuborganizacion(input: { nombre: string }) {
  await requireAuth(["administrador", "director", "gestor"]);
  const { nombre } = suborganizacionSchema.parse(input);

  await apiFetch<unknown>("/suborganizaciones", { method: "POST", body: { name: nombre } });
  revalidateSuborganizaciones();
  return { ok: true };
}

export async function updateSuborganizacion(id: string, input: { nombre: string }) {
  await requireAuth(["administrador", "director", "gestor"]);
  const suborgId = z.uuid().parse(id);
  const { nombre } = suborganizacionSchema.parse(input);

  await apiFetch<unknown>(`/suborganizaciones/${suborgId}`, {
    method: "PUT",
    body: { name: nombre },
  });
  revalidateSuborganizaciones();
  return { ok: true };
}

export async function setSuborganizacionEstado(id: string, estado: boolean) {
  await requireAuth(["administrador", "director", "gestor"]);
  const suborgId = z.uuid().parse(id);

  await apiFetch<unknown>(`/suborganizaciones/${suborgId}/estado`, {
    method: "PATCH",
    body: { isActive: estado },
  });
  revalidateSuborganizaciones();
  return { ok: true };
}
