import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import {
  PAGE_SIZE,
  type Paginado,
  type ProcesoRow,
  type SincronizacionRow,
  type SecopFiltros,
  type BuscarEnVivoRow,
} from "@/lib/secop-shared";

type ProcesoResponse = ApiSchemas["ProcesoDetectadoResponse"];
type ProcesoListResponse = ApiSchemas["ProcesoDetectadoListResponse"];
type SyncRunResponse = ApiSchemas["SecopSyncRunResponse"];
type SyncRunListResponse = ApiSchemas["SecopSyncRunListResponse"];
type SecopFiltrosResponse = ApiSchemas["SecopFiltrosResponse"];
type BuscarEnVivoResponse = ApiSchemas["BuscarEnVivoResponse"];
type BuscarEnVivoRowResponse = ApiSchemas["BuscarEnVivoRowResponse"];

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function toProcesoRow(r: ProcesoResponse): ProcesoRow {
  return {
    id: r.id,
    secopId: r.secopId,
    dataset: r.dataset,
    titulo: r.title ?? null,
    entidad: r.entityName ?? null,
    objeto: r.subject ?? null,
    modalidad: r.modality ?? null,
    estado: r.status ?? null,
    fase: r.phase ?? null,
    valor: toNumber(r.value),
    fechaPublicacion: r.publicationDate ?? null,
    fechaCierre: r.closingDate ?? null,
    url: r.secopUrl ?? null,
    esNuevo: r.isNew,
    promovido: r.promotedToFollowup,
    descartado: r.isDiscarded,
    entidadRegistrada: r.entidadRegistrada,
    detectadoEl: r.firstDetectedAt,
  };
}

function toSincronizacionRow(r: SyncRunResponse): SincronizacionRow {
  return {
    id: r.id,
    dataset: r.dataset,
    estado: r.status,
    inicio: r.startedAt,
    fin: r.finishedAt ?? null,
    consultados: toNumber(r.fetchedCount) ?? 0,
    insertados: toNumber(r.insertedCount) ?? 0,
    actualizados: toNumber(r.updatedCount) ?? 0,
    errorCode: r.errorCode ?? null,
    errorMessage: r.errorMessage ?? null,
  };
}

export async function listProcesosSecop(params: {
  dataset?: string;
  soloNuevos?: boolean;
  buscar?: string;
  entidad?: string;
  objeto?: string;
  modalidad?: string;
  estado?: string;
  fase?: string;
  cuantiaMin?: number;
  cuantiaMax?: number;
  detectadoDesde?: string;
  detectadoHasta?: string;
  soloPromovidos?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<Paginado<ProcesoRow>> {
  const res = await apiFetch<ProcesoListResponse>("/secop/procesos", {
    query: {
      dataset: params.dataset,
      soloNuevos: params.soloNuevos ? "true" : undefined,
      buscar: params.buscar,
      entidad: params.entidad,
      objeto: params.objeto,
      modalidad: params.modalidad,
      estado: params.estado,
      fase: params.fase,
      cuantiaMin: params.cuantiaMin,
      cuantiaMax: params.cuantiaMax,
      detectadoDesde: params.detectadoDesde,
      detectadoHasta: params.detectadoHasta,
      soloPromovidos: params.soloPromovidos ? "true" : undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? PAGE_SIZE,
    },
  });

  return {
    items: res.items.map(toProcesoRow),
    total: toNumber(res.total) ?? 0,
    page: toNumber(res.page) ?? 1,
    pageSize: toNumber(res.pageSize) ?? PAGE_SIZE,
  };
}

export async function listSincronizacionesSecop(limit = 10): Promise<SincronizacionRow[]> {
  const res = await apiFetch<SyncRunListResponse>("/secop/sincronizaciones", {
    query: { page: 1, pageSize: limit },
  });

  return res.items.map(toSincronizacionRow);
}

export async function getSecopFiltros(): Promise<SecopFiltros> {
  const res = await apiFetch<SecopFiltrosResponse>("/secop/procesos/filtros", {});
  return {
    modalidades: res.modalidades,
    estados: res.estados,
    fases: res.fases,
    totalSinFiltrar: toNumber(res.totalSinFiltrar) ?? 0,
  };
}

export async function buscarEnVivo(params: {
  dataset: string;
  keyword?: string;
  entidad?: string;
  nit?: string;
  numeroProceso?: string;
  objeto?: string;
  modalidad?: string;
  estado?: string;
  departamento?: string;
  ciudad?: string;
  unspsc?: string;
  publicadoDesde?: string;
  publicadoHasta?: string;
  cuantiaMin?: number;
  cuantiaMax?: number;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: BuscarEnVivoRow[]; page: number; pageSize: number }> {
  const res = await apiFetch<BuscarEnVivoResponse>("/secop/buscar-en-vivo", {
    method: "POST",
    body: {
      dataset: params.dataset,
      keyword: params.keyword,
      entidad: params.entidad,
      nit: params.nit,
      numeroProceso: params.numeroProceso,
      objeto: params.objeto,
      modalidad: params.modalidad,
      estado: params.estado,
      departamento: params.departamento,
      ciudad: params.ciudad,
      unspsc: params.unspsc,
      publicadoDesde: params.publicadoDesde,
      publicadoHasta: params.publicadoHasta,
      cuantiaMin: params.cuantiaMin,
      cuantiaMax: params.cuantiaMax,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    },
  });

  return {
    rows: res.rows.map((r: BuscarEnVivoRowResponse) => ({
      secopId: r.secopId,
      titulo: r.title ?? null,
      entidad: r.entityName ?? null,
      entityNit: r.entityNit ?? null,
      objeto: r.subject ?? null,
      modalidad: r.modality ?? null,
      estado: r.status ?? null,
      fase: r.phase ?? null,
      valor: toNumber(r.value),
      fechaPublicacion: r.publicationDate ?? null,
      fechaCierre: r.closingDate ?? null,
      url: r.secopUrl ?? null,
    })),
    page: toNumber(res.page) ?? 1,
    pageSize: toNumber(res.pageSize) ?? 25,
  };
}
