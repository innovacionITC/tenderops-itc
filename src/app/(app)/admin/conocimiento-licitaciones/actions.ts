"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import { requireAuth } from "@/lib/auth/session";

export type EstadoConocimiento = ApiSchemas["EstadoConocimientoResult"];
export type CargaConocimiento = ApiSchemas["CargaConocimientoResult"];
export type VistaPreviaConocimiento = ApiSchemas["VistaPreviaConocimiento"];

const RUTA = "/admin/conocimiento-licitaciones";
const EXTENSIONES = [".docx", ".xlsx"];
const MAX_ARCHIVOS = 12;
const MAX_BYTES = 10 * 1024 * 1024;

export async function getConocimientoLicitaciones() {
  await requireAuth(["superadmin", "administrador"]);
  return apiFetch<EstadoConocimiento>("/conocimiento-licitaciones");
}

// Paso 1: procesa los documentos y devuelve la vista previa. No cambia los datos
// que usa el análisis hasta que se aplique la carga.
export async function previsualizarCarga(formData: FormData) {
  await requireAuth(["superadmin", "administrador"]);

  const archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File && f.size > 0);
  if (archivos.length === 0) throw new Error("Selecciona al menos un documento.");
  if (archivos.length > MAX_ARCHIVOS) throw new Error(`Puedes subir hasta ${MAX_ARCHIVOS} documentos a la vez.`);
  const invalidos = archivos.filter(
    (f) => f.size > MAX_BYTES || !EXTENSIONES.some((e) => f.name.toLowerCase().endsWith(e)),
  );
  if (invalidos.length > 0) {
    throw new Error(`Solo se aceptan .docx y .xlsx de hasta 10 MB: ${invalidos.map((f) => f.name).join(", ")}.`);
  }

  const fd = new FormData();
  for (const archivo of archivos) fd.append("archivos", archivo, archivo.name);
  const resultado = await apiFetch<CargaConocimiento>("/conocimiento-licitaciones/previsualizar", { method: "POST", body: fd });
  revalidatePath(RUTA);
  return resultado;
}

export async function aplicarCarga(cargaId: string) {
  await requireAuth(["superadmin", "administrador"]);
  const id = z.uuid().parse(cargaId);
  await apiFetch<unknown>(`/conocimiento-licitaciones/${id}/aplicar`, { method: "POST" });
  revalidatePath(RUTA);
}

export async function descartarCarga(cargaId: string) {
  await requireAuth(["superadmin", "administrador"]);
  const id = z.uuid().parse(cargaId);
  await apiFetch<unknown>(`/conocimiento-licitaciones/${id}/descartar`, { method: "POST" });
  revalidatePath(RUTA);
}
