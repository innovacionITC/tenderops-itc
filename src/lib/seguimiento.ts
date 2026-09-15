import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ProcesoSeguimientoRow, SeguimientoFiltrosDisponibles } from "./seguimiento-shared";

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
  fase: string | null;
  detectado: string | null;
};

type SeguimientoFiltrosResponse = {
  entidades: string[];
  modalidades: string[];
  fases: string[];
};

export type SeguimientoFiltros = {
  buscar?: string;
  entidad?: string;
  objeto?: string;
  modalidad?: string;
  fase?: string;
  cuantiaMin?: number;
  cuantiaMax?: number;
  detectadoDesde?: string;
  detectadoHasta?: string;
  presentacionDesde?: string;
  presentacionHasta?: string;
  estado?: string;
  resultado?: string;
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
    fase: r.fase ?? null,
    detectadoEl: r.detectado ?? null,
  };
}

export async function listProcesosSeguimiento(filtros: SeguimientoFiltros = {}): Promise<ProcesoSeguimientoRow[]> {
  const qs = new URLSearchParams();
  if (filtros.buscar?.trim()) qs.set("buscar", filtros.buscar.trim());
  if (filtros.entidad?.trim()) qs.set("entidad", filtros.entidad.trim());
  if (filtros.objeto?.trim()) qs.set("objeto", filtros.objeto.trim());
  if (filtros.modalidad) qs.set("modalidad", filtros.modalidad);
  if (filtros.fase) qs.set("fase", filtros.fase);
  if (filtros.cuantiaMin != null) qs.set("cuantiaMin", String(filtros.cuantiaMin));
  if (filtros.cuantiaMax != null) qs.set("cuantiaMax", String(filtros.cuantiaMax));
  if (filtros.detectadoDesde) qs.set("detectadoDesde", filtros.detectadoDesde);
  if (filtros.detectadoHasta) qs.set("detectadoHasta", filtros.detectadoHasta);
  if (filtros.presentacionDesde) qs.set("presentacionDesde", filtros.presentacionDesde);
  if (filtros.presentacionHasta) qs.set("presentacionHasta", filtros.presentacionHasta);
  if (filtros.estado) qs.set("estado", filtros.estado);
  if (filtros.resultado) qs.set("resultado", filtros.resultado);

  const path = qs.size > 0 ? `/procesos-seguimiento?${qs}` : "/procesos-seguimiento";
  const rows = await apiFetch<ProcesoSeguimientoResponse[]>(path);
  return rows.map(toProcesoSeguimientoRow);
}

export async function getProcesoSeguimiento(id: string): Promise<ProcesoSeguimientoRow> {
  const r = await apiFetch<ProcesoSeguimientoResponse>(`/procesos-seguimiento/${id}`);
  return toProcesoSeguimientoRow(r);
}

export async function getSeguimientoFiltros(): Promise<SeguimientoFiltrosDisponibles> {
  const r = await apiFetch<SeguimientoFiltrosResponse>("/procesos-seguimiento/filtros");
  return {
    entidades: r.entidades,
    modalidades: r.modalidades,
    fases: r.fases,
  };
}
