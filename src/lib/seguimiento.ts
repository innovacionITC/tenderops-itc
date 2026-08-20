import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ProcesoSeguimientoRow } from "./seguimiento-shared";

type ProcesoSeguimientoResponse = {
  id: string;
  detectedProcessId: string | null;
  secopId: string | null;
  dataset: string | null;
  titulo: string | null;
  entidad: string | null;
  objeto: string | null;
  modalidad: string | null;
  valor: number | string | null;
  fechaPresentacionOferta: string | null;
  url: string | null;
  estado: string;
  resultado: string | null;
  responsableUserId: string | null;
  createdAt: string;
  updatedAt: string;
  crmOpportunityId: string | null;
  crmOpportunityUrl: string | null;
  crmCreatedAt: string | null;
  motivoDescarte: string | null;
  valorAdjudicado: number | string | null;
  fechaAdjudicacion: string | null;
};

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function toProcesoSeguimientoRow(r: ProcesoSeguimientoResponse): ProcesoSeguimientoRow {
  return {
    id: r.id,
    detectedProcessId: r.detectedProcessId ?? null,
    secopId: r.secopId ?? null,
    dataset: r.dataset ?? null,
    titulo: r.titulo ?? null,
    entidad: r.entidad ?? null,
    objeto: r.objeto ?? null,
    modalidad: r.modalidad ?? null,
    valor: toNumber(r.valor),
    fechaPresentacionOferta: r.fechaPresentacionOferta ?? null,
    url: r.url ?? null,
    estado: r.estado as ProcesoSeguimientoRow["estado"],
    resultado: r.resultado ?? null,
    responsableUserId: r.responsableUserId ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    crmOpportunityId: r.crmOpportunityId ?? null,
    crmOpportunityUrl: r.crmOpportunityUrl ?? null,
    crmCreatedAt: r.crmCreatedAt ?? null,
    motivoDescarte: r.motivoDescarte ?? null,
    valorAdjudicado: toNumber(r.valorAdjudicado),
    fechaAdjudicacion: r.fechaAdjudicacion ?? null,
  };
}

export async function listProcesosSeguimiento(): Promise<ProcesoSeguimientoRow[]> {
  const rows = await apiFetch<ProcesoSeguimientoResponse[]>("/procesos-seguimiento");
  return rows.map(toProcesoSeguimientoRow);
}

export async function getProcesoSeguimiento(id: string): Promise<ProcesoSeguimientoRow> {
  const r = await apiFetch<ProcesoSeguimientoResponse>(`/procesos-seguimiento/${id}`);
  return toProcesoSeguimientoRow(r);
}
