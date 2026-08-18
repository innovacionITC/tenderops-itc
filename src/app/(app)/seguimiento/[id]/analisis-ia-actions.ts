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
