import "server-only";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type ParametricaConfig = {
  id: string | null;
  habilitado: boolean;
  datasetSecopI: boolean;
  datasetSecopIi: boolean;
  diasHaciaAtras: number | null;
  intervalosCronMin: number | null;
  maxResultadosConsulta: number | null;
  valorMinimo: string | null;
  valorMaximo: string | null;
  palabrasClave: string[];
  modalidadIds: string[];
  entidadIds: string[];
  estadoSecopIds: string[];
  /** Antes siempre vacío (bug de origen: el save escribía unspsc_parametros
   * pero el get nunca los leía). La API sí los devuelve desde la Fase 5. */
  unspscIds: string[];
  departamentoIds: string[];
  ciudadIds: string[];
};

export type CatalogItem = { id: string; label: string; estado: boolean | null };

export async function getParametricaConfig(): Promise<ParametricaConfig | null> {
  let config: ApiSchemas["ParametricaConfigResponse"];
  try {
    config = await apiFetch<ApiSchemas["ParametricaConfigResponse"]>("/parametrica");
  } catch (e) {
    // Sin fila de configuración todavía: la API responde 404
    // (parametrica_no_configurada) y el front conserva su contrato de `null`.
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }

  return {
    id: config.id,
    habilitado: config.isEnabled,
    datasetSecopI: config.secopIEnabled,
    datasetSecopIi: config.secopIiEnabled,
    diasHaciaAtras: Number(config.lookbackDays),
    intervalosCronMin: Number(config.cronIntervalMinutes),
    maxResultadosConsulta: Number(config.maxQueryResults),
    valorMinimo: config.minValue == null ? null : String(config.minValue),
    valorMaximo: config.maxValue == null ? null : String(config.maxValue),
    palabrasClave: config.keywords,
    modalidadIds: config.modalityIds,
    entidadIds: config.entityIds,
    estadoSecopIds: config.secopStatusIds,
    unspscIds: config.unspscCodeIds,
    departamentoIds: config.departmentIds,
    ciudadIds: config.cityIds,
  };
}

export async function listModalidades(): Promise<CatalogItem[]> {
  const rows = await apiFetch<ApiSchemas["ModalidadResponse"][]>("/modalidades");
  return rows.map((r) => ({
    id: r.id,
    label: r.description || r.code || "(sin nombre)",
    estado: r.isActive,
  }));
}

export async function listEntidades(): Promise<CatalogItem[]> {
  const rows = await apiFetch<ApiSchemas["EntidadResponse"][]>("/entidades");
  return rows.map((r) => ({ id: r.id, label: r.name, estado: r.isActive }));
}

export async function listEstadosSecop(): Promise<CatalogItem[]> {
  const rows = await apiFetch<ApiSchemas["EstadoSecopResponse"][]>("/estados-secop");
  return rows.map((r) => ({ id: r.id, label: r.name, estado: r.isActive }));
}

export type ModalidadRow = {
  id: string;
  descripcion: string | null;
  codigo: string | null;
  estado: boolean | null;
};

export async function listModalidadesAdmin(): Promise<ModalidadRow[]> {
  const rows = await apiFetch<ApiSchemas["ModalidadResponse"][]>("/modalidades");
  return rows.map((r) => ({
    id: r.id,
    descripcion: r.description,
    codigo: r.code,
    estado: r.isActive,
  }));
}

export type EntidadRow = {
  id: string;
  nombre: string;
  estado: boolean | null;
  nit: string | null;
  dv: string | null;
};

export async function listEntidadesAdmin(): Promise<EntidadRow[]> {
  const rows = await apiFetch<ApiSchemas["EntidadResponse"][]>("/entidades");
  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    estado: r.isActive,
    nit: r.nit ?? null,
    dv: r.dv ?? null,
  }));
}

// ── Ubicaciones (departamentos y ciudades) ──────────────────────────────────
// Ciudades son ~1.100 filas (municipios DANE): nunca se cargan completas al
// cliente. La búsqueda corre en la API (GET /ciudades/buscar, índice trigram
// insensible a acentos, límite CIUDAD_SEARCH_LIMIT).

export async function listDepartamentos(): Promise<CatalogItem[]> {
  const rows = await apiFetch<ApiSchemas["DepartamentoResponse"][]>("/departamentos");
  return rows.map((r) => ({ id: r.id, label: r.name, estado: r.isActive }));
}

export { CIUDAD_SEARCH_LIMIT } from "./parametrica-shared";

// El límite (CIUDAD_SEARCH_LIMIT) ahora lo aplica la API, por eso ya no es
// parámetro. El endpoint de búsqueda no expone `estado` (solo id + label
// listos para el picker); se conserva el shape CatalogItem por compatibilidad.
export async function searchCiudades(q: string): Promise<CatalogItem[]> {
  const term = q.trim();
  if (!term) return [];
  const rows = await apiFetch<ApiSchemas["CiudadSearchResponse"][]>("/ciudades/buscar", {
    query: { q: term },
  });
  return rows.map((r) => ({ id: r.id, label: r.label, estado: null }));
}

/** Etiquetas de ciudades ya seleccionadas (para hidratar el picker asíncrono). */
export async function listCiudadesByIds(ids: string[]): Promise<CatalogItem[]> {
  if (ids.length === 0) return [];
  const wanted = new Set(ids);
  const rows = await apiFetch<ApiSchemas["CiudadResponse"][]>("/ciudades");
  return rows
    .filter((r) => wanted.has(r.id))
    .map((r) => ({
      id: r.id,
      label: r.departmentName ? `${r.name} (${r.departmentName})` : r.name,
      estado: r.isActive,
    }));
}

export type DepartamentoRow = {
  id: string;
  nombre: string;
  estado: boolean | null;
  ciudadCount: number;
};

export async function listDepartamentosAdmin(): Promise<DepartamentoRow[]> {
  const rows = await apiFetch<ApiSchemas["DepartamentoResponse"][]>("/departamentos");
  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    estado: r.isActive,
    ciudadCount: Number(r.cityCount),
  }));
}

export type SuborganizacionRow = {
  id: string;
  nombre: string;
  estado: boolean | null;
};

export async function listSuborganizacionesAdmin(): Promise<SuborganizacionRow[]> {
  const rows = await apiFetch<{ id: string; name: string; isActive: boolean }[]>("/suborganizaciones");
  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    estado: r.isActive,
  }));
}

export type CiudadRow = {
  id: string;
  nombre: string;
  departamentoId: string | null;
  departamentoNombre: string | null;
  estado: boolean | null;
};

export async function listCiudadesAdmin(): Promise<CiudadRow[]> {
  const rows = await apiFetch<ApiSchemas["CiudadResponse"][]>("/ciudades");
  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    departamentoId: r.departmentId,
    departamentoNombre: r.departmentName,
    estado: r.isActive,
  }));
}
