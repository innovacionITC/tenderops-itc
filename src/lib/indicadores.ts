import "server-only";
import { apiFetch } from "@/lib/api/client";

export type IndicadoresConsultaResult = {
  indicadores: IndicadorConsultaRow[];
  suborganizaciones: SuborganizacionColumn[];
};

// Incluye los campos de fórmula (además de los valores ya calculados) para que la pantalla
// pueda precargar el modal de "Editar indicador" sin pisar la fórmula de un derivado existente.
export type IndicadorConsultaRow = {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  tipo: string;
  valorOrganizacionPrincipal: number | null;
  valoresSuborganizaciones: ValorPorSuborganizacion[];
  isActive: boolean;
  formulaNumeradorIds: string[] | null;
  formulaDenominadorIds: string[] | null;
  formulaMultiplicador: number | null;
};

export type ValorPorSuborganizacion = {
  suborganizacionId: string;
  suborganizacionNombre: string;
  valor: number | null;
};

export type SuborganizacionColumn = {
  id: string;
  nombre: string;
};

export async function listIndicadores(anio: number): Promise<IndicadoresConsultaResult> {
  return apiFetch<IndicadoresConsultaResult>("/indicadores", { query: { anio } });
}
