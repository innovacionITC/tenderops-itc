export type ProcesoSeguimientoRow = {
  id: string;
  detectedProcessId: string | null;
  secopId: string | null;
  dataset: string | null;
  titulo: string | null;
  entidad: string | null;
  objeto: string | null;
  modalidad: string | null;
  valor: number | null;
  fechaPresentacionOferta: string | null;
  url: string | null;
  estado: "en_seguimiento" | "presentado" | "cerrado";
  resultado: string | null;
  responsableUserId: string | null;
  createdAt: string;
  updatedAt: string;
  crmOpportunityId: string | null;
  crmOpportunityUrl: string | null;
  crmCreatedAt: string | null;
  motivoDescarte: string | null;
  valorAdjudicado: number | null;
  fechaAdjudicacion: string | null;
  fase: string | null;
  detectadoEl: string | null;
};

export type SeguimientoFiltrosDisponibles = {
  entidades: string[];
  modalidades: string[];
  fases: string[];
};

export const RESULTADO_OPCIONES = [
  { value: "presentado", label: "Presentado" },
  { value: "no_adjudicado", label: "No adjudicado" },
  { value: "descartado", label: "Descartado" },
  { value: "adjudicado", label: "Adjudicado" },
] as const;

export function opcionesMarcarDisponibles(estado: string, resultado: string | null) {
  const internalStatus = resultado ?? (estado === "en_seguimiento" ? "en_seguimiento" : estado);
  if (internalStatus === "en_seguimiento") {
    return RESULTADO_OPCIONES.filter((o) => o.value === "presentado" || o.value === "descartado");
  }
  if (internalStatus === "presentado") {
    return RESULTADO_OPCIONES.filter((o) =>
      o.value === "adjudicado" || o.value === "no_adjudicado" || o.value === "descartado",
    );
  }
  return [];
}

export const TAREA_TITULO_OPCIONES = [
  "Preparar documentos habilitantes",
  "Revisar pliego de condiciones",
  "Elaborar propuesta técnica",
  "Elaborar propuesta económica",
  "Radicar oferta",
  "Seguimiento de adjudicación",
  "Otro",
] as const;
