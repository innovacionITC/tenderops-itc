"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { plantillaSchema, createArchivoSchema, archivoSchema } from "./schema";

function revalidatePlantillas() {
  revalidatePath("/admin/plantillas");
}

export async function createPlantilla(formData: FormData) {
  await requireAuth(["administrador"]);

  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const file = formData.get("file") as File | null;

  const parsed = plantillaSchema.parse({ nombre, descripcion });

  const fd = new FormData();
  fd.append("name", parsed.nombre);
  fd.append("description", parsed.descripcion);
  if (file && file.size > 0) {
    createArchivoSchema.parse(file);
    fd.append("file", file);
  } else {
    throw new Error("El archivo es obligatorio");
  }

  await apiFetch<unknown>("/plantillas", { method: "POST", body: fd });
  revalidatePlantillas();
  return { ok: true };
}

export async function updatePlantilla(id: string, formData: FormData) {
  await requireAuth(["administrador"]);
  const plantillaId = z.uuid().parse(id);

  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const file = formData.get("file") as File | null;

  const parsed = plantillaSchema.parse({ nombre, descripcion });

  const fd = new FormData();
  fd.append("name", parsed.nombre);
  fd.append("description", parsed.descripcion);
  if (file && file.size > 0) {
    archivoSchema.parse(file);
    fd.append("file", file);
  }

  await apiFetch<unknown>(`/plantillas/${plantillaId}`, { method: "PUT", body: fd });
  revalidatePlantillas();
  return { ok: true };
}

export async function deletePlantilla(id: string) {
  await requireAuth(["administrador"]);
  const plantillaId = z.uuid().parse(id);

  await apiFetch<unknown>(`/plantillas/${plantillaId}`, { method: "DELETE" });
  revalidatePlantillas();
  return { ok: true };
}
