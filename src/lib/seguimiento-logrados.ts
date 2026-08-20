import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { Paginado } from "./secop-shared";
import type { ProcesoLogradoRow } from "./seguimiento-logrados-shared";

type ProcesoLogradoResponse = {
  id: string;
  numeroProceso: string | null;
  entidad: string | null;
  objeto: string | null;
  responsableNombre: string | null;
  estado: string;
  valorAdjudicado: number | string | null;
  valorEstimado: number | string | null;
  fechaAdjudicacion: string | null;
  fechaUltimaActualizacion: string;
};

type ProcesoLogradoListResponse = {
  items: ProcesoLogradoResponse[];
  total: number | string;
  page: number | string;
  pageSize: number | string;
};

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function toProcesoLogradoRow(r: ProcesoLogradoResponse): ProcesoLogradoRow {
  return {
    id: r.id,
    secopId: r.numeroProceso ?? null,
    entidad: r.entidad ?? null,
    objeto: r.objeto ?? null,
    responsableNombre: r.responsableNombre ?? null,
    estado: r.estado,
    valorAdjudicado: toNumber(r.valorAdjudicado),
    valorEstimado: toNumber(r.valorEstimado),
    fechaAdjudicacion: r.fechaAdjudicacion ?? null,
    fechaUltimaActualizacion: r.fechaUltimaActualizacion,
  };
}

export async function listProcesosLogrados(params: {
  numeroProceso?: string;
  entidad?: string;
  responsableUserId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  valorAdjudicadoMin?: number;
  valorAdjudicadoMax?: number;
  palabraClave?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginado<ProcesoLogradoRow>> {
  const res = await apiFetch<ProcesoLogradoListResponse>(
    "/procesos-seguimiento/logrados",
    {
      query: {
        numeroProceso: params.numeroProceso,
        entidad: params.entidad,
        responsableUserId: params.responsableUserId,
        fechaDesde: params.fechaDesde,
        fechaHasta: params.fechaHasta,
        valorAdjudicadoMin: params.valorAdjudicadoMin,
        valorAdjudicadoMax: params.valorAdjudicadoMax,
        palabraClave: params.palabraClave,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 25,
      },
    },
  );

  return {
    items: res.items.map(toProcesoLogradoRow),
    total: toNumber(res.total) ?? 0,
    page: toNumber(res.page) ?? 1,
    pageSize: toNumber(res.pageSize) ?? 25,
  };
}
