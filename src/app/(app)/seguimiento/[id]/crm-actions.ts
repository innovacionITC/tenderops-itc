"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";

type CrmOportunidadResponse = {
  opportunityId: string;
  opportunityUrl: string | null;
};

export async function crearOportunidadCrm(procesoId: string, tema: string) {
  await requireAuth(["administrador", "director", "gestor"]);
  const id = z.uuid().parse(procesoId);
  const temaValidado = z.string().trim().min(1).max(300).parse(tema);

  const result = await apiFetch<CrmOportunidadResponse>(
    `/procesos-seguimiento/${id}/crm/oportunidad`,
    {
      method: "POST",
      body: { tema: temaValidado },
    },
  );

  revalidatePath("/seguimiento/" + id);
  return result;
}
