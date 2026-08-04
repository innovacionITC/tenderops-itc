import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import { PAGE_SIZE, type Paginado, type ProcesoRow, type SincronizacionRow } from "@/lib/secop-shared";

type ProcesoResponse = ApiSchemas["ProcesoDetectadoResponse"];
type ProcesoListResponse = ApiSchemas["ProcesoDetectadoListResponse"];
type SyncRunResponse = ApiSchemas["SecopSyncRunResponse"];
type SyncRunListResponse = ApiSchemas["SecopSyncRunListResponse"];

// openapi-typescript tipa los `decimal`/`int32` de .NET como `number | string`
// porque el serializador puede emitir cualquiera de los dos. Se normaliza acá.
function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

// La API responde en inglés (mismo criterio que src/lib/parametrica.ts): el
// mapeo a español vive acá para que las vistas no dependan del shape del backend.
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
    valor: toNumber(r.value),
    fechaPublicacion: r.publicationDate ?? null,
    fechaCierre: r.closingDate ?? null,
    url: r.secopUrl ?? null,
    esNuevo: r.isNew,
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
  page?: number;
}): Promise<Paginado<ProcesoRow>> {
  const res = await apiFetch<ProcesoListResponse>("/secop/procesos", {
    query: {
      dataset: params.dataset,
      soloNuevos: params.soloNuevos ? "true" : undefined,
      buscar: params.buscar,
      page: params.page ?? 1,
      pageSize: PAGE_SIZE,
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
