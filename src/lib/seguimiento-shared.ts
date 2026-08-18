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
  estado: "en_seguimiento" | "cerrado";
  resultado: string | null;
  responsableUserId: string | null;
  createdAt: string;
  updatedAt: string;
  crmOpportunityId: string | null;
  crmOpportunityUrl: string | null;
  crmCreatedAt: string | null;
};

export const RESULTADO_OPCIONES = [
  { value: "presentado", label: "Presentado" },
  { value: "no_adjudicado", label: "No adjudicado" },
  { value: "descartado", label: "Descartado" },
] as const;

export const TAREA_TITULO_OPCIONES = [
  "Preparar documentos habilitantes",
  "Revisar pliego de condiciones",
  "Elaborar propuesta técnica",
  "Elaborar propuesta económica",
  "Radicar oferta",
  "Seguimiento de adjudicación",
  "Otro",
] as const;
