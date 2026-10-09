import { notFound } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { getProcesoSeguimiento } from "@/lib/seguimiento";
import { getAnalisisIa } from "./analisis-ia-actions";
import {
  listCitasOportunidadCrm,
  listDocumentosCrm,
  listEquipoComercialCrm,
  listPrioridadesCitaCrm,
  type CitaCrmRow,
  type CrmOpcionRow,
  type CrmUsuarioRow,
} from "./crm-actions";

export type CitasCrmData = {
  equipo: CrmUsuarioRow[];
  prioridades: CrmOpcionRow[];
  citas: CitaCrmRow[];
  // Mensaje cuando el CRM no respondió: la pestaña sigue funcionando, solo se
  // avisa que el formulario y el listado de citas no están disponibles.
  error: string | null;
};

async function loadCitasCrm(procesoId: string): Promise<CitasCrmData> {
  try {
    const [equipo, prioridades, citas] = await Promise.all([
      listEquipoComercialCrm(),
      listPrioridadesCitaCrm(),
      listCitasOportunidadCrm(procesoId),
    ]);
    return { equipo, prioridades, citas, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "No se pudo consultar el CRM.";
    return { equipo: [], prioridades: [], citas: [], error };
  }
}

export async function loadSeguimientoWorkspaceData(id: string) {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) notFound();

  await requireAuth(["administrador", "director", "gestor"]);

  let proceso;
  try {
    proceso = await getProcesoSeguimiento(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const [analisisIa, documentosCrm, citasCrm] = await Promise.all([
    getAnalisisIa(id),
    // Solo hay documentos que consultar una vez que existe la oportunidad —
    // antes de eso el endpoint no tiene nada que devolver.
    proceso.crmOpportunityId ? listDocumentosCrm(id) : Promise.resolve([]),
    // Igual que los documentos: sin oportunidad no hay citas ni responsables que cargar.
    proceso.crmOpportunityId
      ? loadCitasCrm(id)
      : Promise.resolve<CitasCrmData>({ equipo: [], prioridades: [], citas: [], error: null }),
  ]);

  const directLineBaseUrl = process.env.NEXT_PUBLIC_DIRECTLINE_BASE_URL ?? "";

  return {
    proceso,
    analisisIa,
    documentosCrm,
    citasCrm,
    directLineBaseUrl,
  };
}
