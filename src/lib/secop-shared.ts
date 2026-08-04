// Constantes y tipos de SECOP compartidos entre servidor y cliente.
// (lib/secop.ts es server-only —importa next/headers vía apiFetch— y no puede
// importarse desde componentes cliente; lo que necesiten ambos lados vive aquí.)

/** Los dos datasets que ingesta el job (`detected_processes.dataset`). */
export const DATASETS = ["secop_i", "secop_ii"] as const;
export type Dataset = (typeof DATASETS)[number];

export const datasetLabels: Record<string, string> = {
  secop_i: "SECOP I",
  secop_ii: "SECOP II",
};

/** Debe coincidir con el pageSize que pide listProcesosSecop. */
export const PAGE_SIZE = 25;

export type ProcesoRow = {
  id: string;
  secopId: string;
  dataset: string;
  titulo: string | null;
  entidad: string | null;
  objeto: string | null;
  modalidad: string | null;
  estado: string | null;
  valor: number | null;
  fechaPublicacion: string | null;
  fechaCierre: string | null;
  url: string | null;
  esNuevo: boolean;
  detectadoEl: string;
};

export type SincronizacionRow = {
  id: string;
  dataset: string;
  estado: string;
  inicio: string;
  fin: string | null;
  consultados: number;
  insertados: number;
  actualizados: number;
  errorCode: string | null;
  errorMessage: string | null;
};

export type Paginado<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
