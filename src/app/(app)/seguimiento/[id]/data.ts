import { notFound } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { getProcesoSeguimiento } from "@/lib/seguimiento";
import { listTasks } from "@/lib/tasks";
import { listUsuariosAsignables } from "@/lib/usuarios-asignables";
import { getAnalisisIa } from "./analisis-ia-actions";
import { listDocumentosCrm } from "./crm-actions";

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

  const [tareas, usuariosAsignables, analisisIa, documentosCrm] = await Promise.all([
    listTasks(id),
    listUsuariosAsignables(),
    getAnalisisIa(id),
    // Solo hay documentos que consultar una vez que existe la oportunidad —
    // antes de eso el endpoint no tiene nada que devolver.
    proceso.crmOpportunityId ? listDocumentosCrm(id) : Promise.resolve([]),
  ]);

  const directLineBaseUrl = process.env.NEXT_PUBLIC_DIRECTLINE_BASE_URL ?? "";

  return {
    proceso,
    tareas,
    usuariosAsignables,
    analisisIa,
    documentosCrm,
    directLineBaseUrl,
  };
}
