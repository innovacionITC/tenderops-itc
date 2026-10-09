"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

const GUID_CRM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CrmOportunidadResponse = {
  opportunityId: string;
  opportunityUrl: string | null;
};

export type OportunidadDocumentoRow = {
  documentoId: string;
  nombreArchivo: string;
  extension: string;
  tamannoBytes: number;
  estado: "pendiente" | "descargado" | "error";
  errorMensaje: string | null;
  creadoEn: string;
};

export type CrmUsuarioRow = {
  id: string;
  nombre: string;
  email: string | null;
};

export type CrmOpcionRow = {
  valor: number;
  etiqueta: string;
};

export type CitaCrmRow = {
  id: string;
  asunto: string;
  descripcion: string | null;
  inicio: string | null;
  fin: string | null;
  prioridad: number | null;
  prioridadEtiqueta: string | null;
  responsable: string | null;
  estado: string | null;
};

type CitaCrmResponse = {
  citaId: string;
};

export async function crearOportunidadCrm(procesoId: string, tema: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);
  const temaValidado = z.string().trim().min(1).max(300).parse(tema);

  const result = await apiFetch<CrmOportunidadResponse>(
    `/procesos-seguimiento/${id}/crm/oportunidad`,
    {
      method: "POST",
      body: { tema: temaValidado },
    },
  );

  revalidatePath("/seguimiento/" + id);
  return result;
}

export async function listDocumentosCrm(procesoId: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  return apiFetch<OportunidadDocumentoRow[]>(`/procesos-seguimiento/${id}/crm/documentos`);
}

export async function reintentarDescargaDocumentosCrm(procesoId: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);
  await apiFetch<unknown>(`/procesos-seguimiento/${id}/crm/documentos/reintentar`, { method: "POST" });
  return { ok: true as const };
}

export async function listEquipoComercialCrm() {
  await requireAuth(["administrador", "director", "gestor"]);

  return apiFetch<CrmUsuarioRow[]>("/crm/equipo-comercial");
}

export async function listPrioridadesCitaCrm() {
  await requireAuth(["administrador", "director", "gestor"]);

  return apiFetch<CrmOpcionRow[]>("/crm/prioridades-cita");
}

export async function listCitasOportunidadCrm(procesoId: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);

  return apiFetch<CitaCrmRow[]>(`/procesos-seguimiento/${id}/crm/citas`);
}

export async function crearCitaCrm(
  procesoId: string,
  input: {
    titulo: string;
    descripcion?: string;
    responsableCrmId: string;
    fechaLimite: string;
    prioridad: number;
  },
) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);
  const datos = z
    .object({
      titulo: z.string().trim().min(1).max(300),
      descripcion: z.string().trim().optional(),
      // z.uuid() exige versión/variante RFC 4122; los GUID de Dynamics (p. ej. "…-e611-80e1-…") no la cumplen.
      responsableCrmId: z.string().regex(GUID_CRM, "Responsable inválido"),
      fechaLimite: z.string().min(1),
      prioridad: z.number().int(),
    })
    .parse(input);

  const result = await apiFetch<CitaCrmResponse>(`/procesos-seguimiento/${id}/crm/citas`, {
    method: "POST",
    body: {
      titulo: datos.titulo,
      descripcion: datos.descripcion || null,
      responsableCrmId: datos.responsableCrmId,
      fechaLimite: new Date(datos.fechaLimite).toISOString(),
      prioridad: datos.prioridad,
    },
  });

  revalidatePath(`/seguimiento/${id}`);
  revalidatePath("/seguimiento");
  revalidatePath("/calendario");
  return { citaId: result.citaId };
}
