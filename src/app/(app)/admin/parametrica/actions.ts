"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import { requireAuth } from "@/lib/auth/session";
import { searchCiudades } from "@/lib/parametrica";

const saveSchema = z
  .object({
    habilitado: z.boolean(),
    datasetSecopI: z.boolean(),
    datasetSecopIi: z.boolean(),
    diasHaciaAtras: z.number().int().positive(),
    intervalosCronMin: z.number().int().positive(),
    maxResultadosConsulta: z.number().int().positive(),
    valorMinimo: z.number().nullable(),
    valorMaximo: z.number().nullable(),
    palabrasClave: z.array(z.string().trim().min(1)).max(200),
    modalidadIds: z.array(z.uuid()),
    entidadIds: z.array(z.uuid()),
    estadoSecopIds: z.array(z.uuid()),
    unspscIds: z.array(z.uuid()),
    nitIds: z.array(z.uuid()),
    departamentoIds: z.array(z.uuid()),
    ciudadIds: z.array(z.uuid()),
  })
  .refine((v) => v.valorMinimo == null || v.valorMaximo == null || v.valorMinimo <= v.valorMaximo, {
    message: "El valor mínimo no puede ser mayor que el valor máximo.",
    path: ["valorMinimo"],
  });

export async function saveParametricaConfig(input: z.infer<typeof saveSchema>) {
  await requireAuth(["administrador"]);
  const data = saveSchema.parse(input);

  // El PUT es transaccional en la API (upsert + delete-then-insert de las 8
  // tablas puente); un catálogo inexistente responde 422 (catalogo_invalido)
  // con `detail` en español y revierte todo. Auditoría incluida.
  const body: ApiSchemas["SaveParametricaRequest"] = {
    isEnabled: data.habilitado,
    secopIEnabled: data.datasetSecopI,
    secopIiEnabled: data.datasetSecopIi,
    lookbackDays: data.diasHaciaAtras,
    cronIntervalMinutes: data.intervalosCronMin,
    maxQueryResults: data.maxResultadosConsulta,
    minValue: data.valorMinimo,
    maxValue: data.valorMaximo,
    keywords: data.palabrasClave,
    modalityIds: data.modalidadIds,
    entityIds: data.entidadIds,
    secopStatusIds: data.estadoSecopIds,
    unspscCodeIds: data.unspscIds,
    nitIds: data.nitIds,
    departmentIds: data.departamentoIds,
    cityIds: data.ciudadIds,
  };

  await apiFetch<ApiSchemas["SaveParametricaResponse"]>("/parametrica", { method: "PUT", body });

  revalidatePath("/admin/parametricas");
  return { ok: true };
}

/**
 * Búsqueda remota para el picker de ciudades: filtra en la API (índice
 * trigram, insensible a acentos) y devuelve como máximo 50 resultados, para no
 * cargar nunca el catálogo completo (~1.100 municipios) en el cliente.
 */
export async function searchCiudadesParametrica(query: string) {
  await requireAuth(["administrador"]);
  const q = z.string().max(100).parse(query);
  const items = await searchCiudades(q);
  return items.map((i) => ({ id: i.id, label: i.label }));
}

export async function quickAddEstadoSecop(input: { nombre: string }) {
  await requireAuth(["administrador"]);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  // Nombre duplicado → 409 con `detail` en español, burbujea como message.
  const created = await apiFetch<ApiSchemas["QuickAddEstadoSecopResponse"]>(
    "/estados-secop/quick-add",
    { method: "POST", body: { name: nombre } },
  );

  revalidatePath("/admin/parametricas");
  return { id: created.id, label: created.label };
}
