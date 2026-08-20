import type { Paginado } from "./secop-shared";

export type ProcesoLogradoRow = {
  id: string;
  secopId: string | null;
  entidad: string | null;
  objeto: string | null;
  responsableNombre: string | null;
  estado: string;
  valorAdjudicado: number | null;
  valorEstimado: number | null;
  fechaAdjudicacion: string | null;
  fechaUltimaActualizacion: string;
};

export const LOGRADOS_MENSAJE_VACIO =
  "No existen procesos logrados para visualizar con los criterios de búsqueda seleccionados.";

export type LogradosFiltrosDisponibles = {
  responsables: { id: string; name: string }[];
};

export type LogradoPaginado = Paginado<ProcesoLogradoRow>;
