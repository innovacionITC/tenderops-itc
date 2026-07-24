import "server-only";
import { asc, eq } from "drizzle-orm";
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
};

export type CatalogItem = { id: string; label: string; estado: boolean | null };

export async function getParametricaConfig(): Promise<ParametricaConfig | null> {
  const [row] = await db.select().from(parametricaParametros).limit(1);
  if (!row) return null;

  const [keywords, modalidadRows, entidadRows, estadoRows] = await Promise.all([
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
  };
}

export async function listModalidades(): Promise<CatalogItem[]> {
  const rows = await db
    .select({ id: modalidades.id, descripcion: modalidades.descripcion, codigo: modalidades.codigo, estado: modalidades.estado })
    .from(modalidades)
    .orderBy(asc(modalidades.descripcion));
  return rows.map((r) => ({ id: r.id, label: r.descripcion ?? r.codigo ?? "(sin nombre)", estado: r.estado }));
}

export async function listEntidades(): Promise<CatalogItem[]> {
  const rows = await db
    .select({ id: entidades.id, nombre: entidades.nombre, estado: entidades.estado })
    .from(entidades)
    .orderBy(asc(entidades.nombre));
  return rows.map((r) => ({ id: r.id, label: r.nombre, estado: r.estado }));
}

export async function listEstadosSecop(): Promise<CatalogItem[]> {
  const rows = await db
    .select({ id: estadosSecop.id, nombre: estadosSecop.nombre, estado: estadosSecop.estado })
    .from(estadosSecop)
    .orderBy(asc(estadosSecop.nombre));
  return rows.map((r) => ({ id: r.id, label: r.nombre, estado: r.estado }));
}
