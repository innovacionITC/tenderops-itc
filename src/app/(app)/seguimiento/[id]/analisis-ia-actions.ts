"use server";

import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

type AnalisisIaResponse = {
  id: string;
  summary: string | null;
  opportunityLevel: string | null;
  riskLevel: string | null;
  complexityLevel: string | null;
  fit: string | null;
  criticalRequirements: string | null;
  alerts: string | null;
  recommendation: string | null;
  justification: string | null;
  suggestedModality: string | null;
  matrixTotal: number | null;
  matrixCumplidos: number | null;
  matrixPendientes: number | null;
  matrixNoCumple: number | null;
  matrixRiesgoAlto: number | null;
  createdAt: string;
};

// `empresaId` ya no es seleccionable desde el frontend: el bot de Direct Line
// es compartido entre organizaciones (un solo BotSecret, ver
// DirectLineBotClient en la API) y usa este id para saber con la información
// de qué empresa debe analizar el proceso. Dejar elegir cualquiera de las
// organizaciones del usuario permitía ejecutar el análisis de un proceso de
// la organización activa con los datos de otra — ahora siempre se manda la
// organización activa de la sesión, la misma que ya delimita a qué proceso
// se puede acceder.
export async function ejecutarAnalisisIa(procesoId: string) {
  const auth = await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  const r = await apiFetch<AnalisisIaResponse>(`/procesos-seguimiento/${id}/analisis-ia`, {
    method: "POST",
    body: { empresaId: auth.activeOrganizationId },
  });

  return r;
}

// --- Análisis de licitación asíncrono (HU 60125–60128) ---------------------
// El POST responde 202 al instante y el job de Hangfire recorre las etapas;
// la pestaña consulta el estado cada pocos segundos hasta un estado final.

export type EstadoAnalisisLicitacion =
  | "PENDIENTE"
  | "INVENTARIANDO"
  | "EXTRAYENDO"
  | "NORMALIZANDO"
  | "EVALUANDO"
  | "VALIDANDO"
  | "COMPLETADO"
  | "REQUIERE_REVISION"
  | "ERROR";

export type DocumentoAnalisis = {
  id: string;
  nombre: string;
  extension: string;
  estado: "INCLUIDO" | "EXCLUIDO" | "FALTANTE" | "LEIDO" | "FALLIDO";
  motivo: string | null;
  tipoDocumento: string | null;
  paginas: number | null;
  paginasNativas: number | null;
  paginasMixtas: number | null;
  paginasOcr: number | null;
};

export type EstadoAnalisis = {
  id: string;
  version: number;
  estado: EstadoAnalisisLicitacion;
  progreso: number;
  mensaje: string | null;
  correlationId: string;
  solicitadoEn: string;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  forceReanalisis: boolean;
  reutilizadoDe: string | null;
  versionReutilizada: number | null;
  metodologiaVersion: string | null;
  cobertura: number | null;
  errorCodigo: string | null;
  sharePointCarpeta: string | null;
  documentos: DocumentoAnalisis[];
};

export type VersionAnalisis = {
  id: string;
  version: number;
  estado: EstadoAnalisisLicitacion;
  solicitadoEn: string;
  finalizadoEn: string | null;
  reutilizadoDe: string | null;
  cobertura: number | null;
};

export async function solicitarAnalisis(procesoId: string, forceReanalisis: boolean) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  return apiFetch<{ analisisId: string; version: number; estado: EstadoAnalisisLicitacion; correlationId: string }>(
    `/procesos-seguimiento/${id}/analisis-licitacion`,
    { method: "POST", body: { forceReanalisis } },
  );
}

export async function getEstadoAnalisis(procesoId: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  // 204 (todavía no hay análisis) llega como undefined desde apiFetch.
  const result = await apiFetch<EstadoAnalisis | undefined>(`/procesos-seguimiento/${id}/analisis-licitacion`);
  return result ?? null;
}

export async function listVersionesAnalisis(procesoId: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  return apiFetch<VersionAnalisis[]>(`/procesos-seguimiento/${id}/analisis-licitacion/versiones`);
}

export async function getAnalisisIa(procesoId: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  // El backend responde 204 (sin body) cuando aún no hay análisis — apiFetch
  // devuelve undefined en ese caso sin lanzar. Cualquier excepción real
  // (401/500/red) debe propagarse, no confundirse con "todavía no hay análisis".
  const result = await apiFetch<AnalisisIaResponse | undefined>(
    `/procesos-seguimiento/${id}/analisis-ia`,
  );
  return result ?? null;
}
