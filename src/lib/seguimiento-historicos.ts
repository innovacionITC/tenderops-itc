import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { Paginado } from "./secop-shared";
import type { ProcesoHistoricoRow } from "./seguimiento-historicos-shared";

type ProcesoHistoricoResponse = {
  id: string;
  numeroProceso: string | null;
  entidad: string | null;
  objeto: string | null;
  responsableNombre: string | null;
  estadoFinal: string;
  motivoCierre: string;
  valorEstimado: number | string | null;
  fechaCierre: string;
  fechaUltimaActualizacion: string;
};

type ProcesoHistoricoListResponse = {
  items: ProcesoHistoricoResponse[];
  total: number | string;
  page: number | string;
  pageSize: number | string;
};

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function toProcesoHistoricoRow(r: ProcesoHistoricoResponse): ProcesoHistoricoRow {
  return {
    id: r.id,
    secopId: r.numeroProceso ?? null,
    entidad: r.entidad ?? null,
    objeto: r.objeto ?? null,
    responsableNombre: r.responsableNombre ?? null,
    estadoFinal: r.estadoFinal,
    motivoCierre: r.motivoCierre,
    valor: toNumber(r.valorEstimado),
    fechaCierre: r.fechaCierre,
    fechaUltimaActualizacion: r.fechaUltimaActualizacion,
  };
}

export async function listProcesosHistoricos(params: {
  numeroProceso?: string;
  entidad?: string;
  responsableUserId?: string;
  estadoFinal?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  palabraClave?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginado<ProcesoHistoricoRow>> {
  const res = await apiFetch<ProcesoHistoricoListResponse>(
    "/procesos-seguimiento/historicos",
    {
      query: {
        numeroProceso: params.numeroProceso,
        entidad: params.entidad,
        responsableUserId: params.responsableUserId,
        estadoFinal: params.estadoFinal,
        fechaDesde: params.fechaDesde,
        fechaHasta: params.fechaHasta,
        palabraClave: params.palabraClave,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 25,
      },
    },
  );

  return {
    items: res.items.map(toProcesoHistoricoRow),
    total: toNumber(res.total) ?? 0,
    page: toNumber(res.page) ?? 1,
    pageSize: toNumber(res.pageSize) ?? 25,
  };
}
