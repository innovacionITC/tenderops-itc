"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { calculadoraPluralSchema, guardarValoresSchema, indicadorSchema } from "./schema";

function revalidateIndicadores() {
  revalidatePath("/indicadores");
}

export async function crearIndicador(input: {
  nombre: string;
  categoria: string;
  unidad: string;
  tipo: string;
  formulaNumeradorIds?: string[];
  formulaDenominadorIds?: string[];
  formulaMultiplicador?: number;
}) {
  await requireAuth(["administrador", "director", "gestor"]);
  const parsed = indicadorSchema.parse(input);
  await apiFetch<unknown>("/indicadores", { method: "POST", body: parsed });
  revalidateIndicadores();
  return { ok: true };
}

export async function actualizarIndicador(
  id: string,
  input: {
    nombre: string;
    categoria: string;
    unidad: string;
    tipo: string;
    formulaNumeradorIds?: string[];
    formulaDenominadorIds?: string[];
    formulaMultiplicador?: number;
  },
) {
  await requireAuth(["administrador", "director", "gestor"]);
  const indicadorId = z.uuid().parse(id);
  const parsed = indicadorSchema.parse(input);
  await apiFetch<unknown>(`/indicadores/${indicadorId}`, { method: "PUT", body: parsed });
  revalidateIndicadores();
  return { ok: true };
}

export async function eliminarIndicador(id: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const indicadorId = z.uuid().parse(id);
  await apiFetch<unknown>(`/indicadores/${indicadorId}`, { method: "DELETE" });
  revalidateIndicadores();
  return { ok: true };
}

export async function setIndicadorEstadoAction(id: string, isActive: boolean) {
  await requireAuth(["administrador", "director", "gestor"]);
  const indicadorId = z.uuid().parse(id);
  await apiFetch<unknown>(`/indicadores/${indicadorId}/estado`, { method: "PATCH", body: { isActive } });
  revalidateIndicadores();
  return { ok: true };
}

export async function guardarValores(
  anio: number,
  valores: { indicadorId: string; suborganizacionId?: string; valor: number }[],
) {
  await requireAuth(["administrador", "director", "gestor"]);
  const parsedValores = guardarValoresSchema.parse(valores);
  await apiFetch<unknown>("/indicadores/valores", {
    method: "PUT",
    query: { anio },
    body: { valores: parsedValores },
  });
  revalidateIndicadores();
  return { ok: true };
}

export async function calcularPlural(input: {
  anio: number;
  metodo: string;
  participaciones: { participanteId: string; porcentaje: number }[];
}) {
  await requireAuth(["administrador", "director", "gestor"]);
  const parsed = calculadoraPluralSchema.parse(input);
  return apiFetch<{
    indicadores: {
      id: string;
      nombre: string;
      categoria: string;
      unidad: string;
      tipo: string;
      valorOrganizacionPrincipal: number | null;
      valoresSuborganizaciones: {
        suborganizacionId: string;
        suborganizacionNombre: string;
        valor: number | null;
      }[];
      valorPlural: number | null;
    }[];
  }>("/indicadores/calculadora-plural", { method: "POST", body: parsed });
}
