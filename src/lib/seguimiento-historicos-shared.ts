import type { Paginado } from "./secop-shared";

export type ProcesoHistoricoRow = {
  id: string;
  secopId: string | null;
  entidad: string | null;
  objeto: string | null;
  responsableNombre: string | null;
  estadoFinal: string;
  motivoCierre: string;
  valor: number | null;
  fechaCierre: string;
  fechaUltimaActualizacion: string;
};

export const ESTADO_FINAL_OPCIONES = [
  { value: "cerrado", label: "Cerrado" },
  { value: "no_adjudicado", label: "Perdido" },
  { value: "descartado", label: "Descartado" },
] as const;

export const HISTORICOS_MENSAJE_VACIO =
  "No existen procesos históricos para visualizar con los criterios de búsqueda seleccionados.";

export type HistoricosFiltrosDisponibles = {
  responsables: { id: string; name: string }[];
};

export type HistoricoPaginado = Paginado<ProcesoHistoricoRow>;
