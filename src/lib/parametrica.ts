import "server-only";
import { asc, count, eq, inArray, sql, type SQL } from "drizzle-orm";
import { CIUDAD_SEARCH_LIMIT } from "./parametrica-shared";
import { db } from "@/db";
import {
  parametricaParametros,
  palabrasClave,
  modalidadParametros,
  modalidades,
  entidadesParametros,
  entidades,
  estadoSecopParametros,
  estadosSecop,
  nitParametros,
  nits,
  departamentoParametros,
  departamentos,
  ciudadParametros,
  ciudades,
} from "@/db/schema/schema";

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
  nitIds: string[];
  departamentoIds: string[];
  ciudadIds: string[];
};

export type CatalogItem = { id: string; label: string; estado: boolean | null };

export async function getParametricaConfig(): Promise<ParametricaConfig | null> {
  const [row] = await db.select().from(parametricaParametros).limit(1);
  if (!row) return null;

  const [keywords, modalidadRows, entidadRows, estadoRows, nitRows, departamentoRows, ciudadRows] =
    await Promise.all([
      db
        .select({ palabraClave: palabrasClave.palabraClave })
        .from(palabrasClave)
        .where(eq(palabrasClave.parametricaParametrosId, row.id)),
      db
        .select({ id: modalidadParametros.modalidadId })
        .from(modalidadParametros)
        .where(eq(modalidadParametros.parametricaParametrosId, row.id)),
      db
        .select({ id: entidadesParametros.entidadId })
        .from(entidadesParametros)
        .where(eq(entidadesParametros.parametricaParametrosId, row.id)),
      db
        .select({ id: estadoSecopParametros.estadoSecopId })
        .from(estadoSecopParametros)
        .where(eq(estadoSecopParametros.parametricaParametrosId, row.id)),
      db
        .select({ id: nitParametros.nitId })
        .from(nitParametros)
        .where(eq(nitParametros.parametricaParametrosId, row.id)),
      db
        .select({ id: departamentoParametros.departamentoId })
        .from(departamentoParametros)
        .where(eq(departamentoParametros.parametricaParametrosId, row.id)),
      db
        .select({ id: ciudadParametros.ciudadId })
        .from(ciudadParametros)
        .where(eq(ciudadParametros.parametricaParametrosId, row.id)),
    ]);

  return {
    id: row.id,
    habilitado: row.habilitado,
    datasetSecopI: row.datasetSecopI,
    datasetSecopIi: row.datasetSecopIi,
    diasHaciaAtras: row.diasHaciaAtras,
    intervalosCronMin: row.intervalosCronMin,
    maxResultadosConsulta: row.maxResultadosConsulta,
    valorMinimo: row.valorMinimo,
    valorMaximo: row.valorMaximo,
    palabrasClave: keywords.map((k) => k.palabraClave),
    modalidadIds: modalidadRows.map((m) => m.id).filter((id): id is string => id !== null),
    entidadIds: entidadRows.map((e) => e.id).filter((id): id is string => id !== null),
    estadoSecopIds: estadoRows.map((e) => e.id).filter((id): id is string => id !== null),
    nitIds: nitRows.map((n) => n.id).filter((id): id is string => id !== null),
    departamentoIds: departamentoRows.map((d) => d.id).filter((id): id is string => id !== null),
    ciudadIds: ciudadRows.map((c) => c.id).filter((id): id is string => id !== null),
  };
}

export async function listModalidades(): Promise<CatalogItem[]> {
  const rows = await db
    .select({
      id: modalidades.id,
      descripcion: modalidades.descripcion,
      codigo: modalidades.codigo,
      estado: modalidades.estado,
    })
    .from(modalidades)
    .orderBy(asc(modalidades.descripcion));
  return rows.map((r) => ({
    id: r.id,
    label: r.descripcion ?? r.codigo ?? "(sin nombre)",
    estado: r.estado,
  }));
}

export async function listEntidades(): Promise<CatalogItem[]> {
  const rows = await db
    .select({ id: entidades.id, nombre: entidades.nombre, estado: entidades.estado })
    .from(entidades)
    .orderBy(asc(entidades.nombre));
  return rows.map((r) => ({ id: r.id, label: r.nombre, estado: r.estado }));
}

export async function listNits(): Promise<CatalogItem[]> {
  const rows = await db
    .select({ id: nits.id, nit: nits.nit, descripcion: nits.descripcion, estado: nits.estado })
    .from(nits)
    .orderBy(asc(nits.nit));
  return rows.map((r) => ({
    id: r.id,
    label: r.descripcion ? `${r.nit} — ${r.descripcion}` : r.nit,
    estado: r.estado,
  }));
}

export async function listEstadosSecop(): Promise<CatalogItem[]> {
  const rows = await db
    .select({ id: estadosSecop.id, nombre: estadosSecop.nombre, estado: estadosSecop.estado })
    .from(estadosSecop)
    .orderBy(asc(estadosSecop.nombre));
  return rows.map((r) => ({ id: r.id, label: r.nombre, estado: r.estado }));
}

export type ModalidadRow = {
  id: string;
  descripcion: string | null;
  codigo: string | null;
  estado: boolean | null;
};

export async function listModalidadesAdmin(): Promise<ModalidadRow[]> {
  return db
    .select({
      id: modalidades.id,
      descripcion: modalidades.descripcion,
      codigo: modalidades.codigo,
      estado: modalidades.estado,
    })
    .from(modalidades)
    .orderBy(asc(modalidades.descripcion));
}

export type EntidadRow = { id: string; nombre: string; estado: boolean | null };

export async function listEntidadesAdmin(): Promise<EntidadRow[]> {
  return db
    .select({ id: entidades.id, nombre: entidades.nombre, estado: entidades.estado })
    .from(entidades)
    .orderBy(asc(entidades.nombre));
}

export type NitRow = {
  id: string;
  nit: string;
  descripcion: string | null;
  estado: boolean | null;
};

export async function listNitsAdmin(): Promise<NitRow[]> {
  return db
    .select({ id: nits.id, nit: nits.nit, descripcion: nits.descripcion, estado: nits.estado })
    .from(nits)
    .orderBy(asc(nits.nit));
}

// ── Ubicaciones (departamentos y ciudades) ──────────────────────────────────
// Ciudades son ~1.100 filas (municipios DANE): nunca se cargan completas al
// cliente. La búsqueda corre en Postgres contra el índice trigram creado en
// 0001_ubicaciones_parametrica.sql, insensible a acentos y mayúsculas.

/** Filtro accent/case-insensitive respaldado por los índices *_nombre_trgm. */
function nombreLike(column: typeof ciudades.nombre | typeof departamentos.nombre, q: string): SQL {
  const pattern = `%${q.trim()}%`;
  return sql`immutable_unaccent(lower(${column})) like immutable_unaccent(lower(${pattern}))`;
}

export async function listDepartamentos(): Promise<CatalogItem[]> {
  const rows = await db
    .select({ id: departamentos.id, nombre: departamentos.nombre, estado: departamentos.estado })
    .from(departamentos)
    .orderBy(asc(departamentos.nombre));
  return rows.map((r) => ({ id: r.id, label: r.nombre, estado: r.estado }));
}

export { CIUDAD_SEARCH_LIMIT } from "./parametrica-shared";

export async function searchCiudades(
  q: string,
  limit = CIUDAD_SEARCH_LIMIT,
): Promise<CatalogItem[]> {
  const term = q.trim();
  if (!term) return [];
  const prefix = `${term}%`;
  const rows = await db
    .select({
      id: ciudades.id,
      nombre: ciudades.nombre,
      departamento: departamentos.nombre,
      estado: ciudades.estado,
    })
    .from(ciudades)
    .leftJoin(departamentos, eq(ciudades.departamentoId, departamentos.id))
    .where(nombreLike(ciudades.nombre, term))
    .orderBy(
      // Coincidencias por prefijo primero ("med" → Medellín antes que Ciudad Bolívar).
      sql`case when immutable_unaccent(lower(${ciudades.nombre})) like immutable_unaccent(lower(${prefix})) then 0 else 1 end`,
      asc(ciudades.nombre),
    )
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    label: r.departamento ? `${r.nombre} (${r.departamento})` : r.nombre,
    estado: r.estado,
  }));
}

/** Etiquetas de ciudades ya seleccionadas (para hidratar el picker asíncrono). */
export async function listCiudadesByIds(ids: string[]): Promise<CatalogItem[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      id: ciudades.id,
      nombre: ciudades.nombre,
      departamento: departamentos.nombre,
      estado: ciudades.estado,
    })
    .from(ciudades)
    .leftJoin(departamentos, eq(ciudades.departamentoId, departamentos.id))
    .where(inArray(ciudades.id, ids))
    .orderBy(asc(ciudades.nombre));
  return rows.map((r) => ({
    id: r.id,
    label: r.departamento ? `${r.nombre} (${r.departamento})` : r.nombre,
    estado: r.estado,
  }));
}

export type DepartamentoRow = {
  id: string;
  nombre: string;
  estado: boolean | null;
  ciudadCount: number;
};

export async function listDepartamentosAdmin(): Promise<DepartamentoRow[]> {
  return db
    .select({
      id: departamentos.id,
      nombre: departamentos.nombre,
      estado: departamentos.estado,
      ciudadCount: count(ciudades.id),
    })
    .from(departamentos)
    .leftJoin(ciudades, eq(ciudades.departamentoId, departamentos.id))
    .groupBy(departamentos.id, departamentos.nombre, departamentos.estado)
    .orderBy(asc(departamentos.nombre));
}

export type CiudadRow = {
  id: string;
  nombre: string;
  departamentoId: string | null;
  departamentoNombre: string | null;
  estado: boolean | null;
};

export async function listCiudadesAdmin(): Promise<CiudadRow[]> {
  return db
    .select({
      id: ciudades.id,
      nombre: ciudades.nombre,
      departamentoId: ciudades.departamentoId,
      departamentoNombre: departamentos.nombre,
      estado: ciudades.estado,
    })
    .from(ciudades)
    .leftJoin(departamentos, eq(ciudades.departamentoId, departamentos.id))
    .orderBy(asc(ciudades.nombre), asc(departamentos.nombre));
}
