"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { buscarEnVivo } from "@/lib/secop";
import type { ApiSchemas } from "@/lib/api/types";

type TriggerSyncResponse = ApiSchemas["TriggerSyncResponse"];

export async function sincronizarSecop() {
  await requireAuth(["administrador"]);

  const res = await apiFetch<TriggerSyncResponse>("/secop/sincronizar", { method: "POST" });

  revalidatePath("/secop");

  return { ok: true as const, jobIdSecopI: res.jobIdSecopI, jobIdSecopIi: res.jobIdSecopIi };
}

export async function promoverProceso(id: string) {
  await requireAuth();
  const procesoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/secop/procesos/${procesoId}/promover`, { method: "PATCH" });

  revalidatePath("/secop");
  revalidatePath("/seguimiento");
  return { ok: true as const };
}

export async function descartarProceso(id: string, motivo?: string) {
  await requireAuth();
  const procesoId = z.uuid().parse(id);

  await apiFetch<unknown>(`/secop/procesos/${procesoId}/descartar`, {
    method: "PATCH",
    body: { motivo: motivo ?? null },
  });

  revalidatePath("/secop");
  return { ok: true as const };
}

export async function buscarEnVivoAction(params: {
  dataset: string;
  keyword?: string;
  entidad?: string;
  nit?: string;
  numeroProceso?: string;
  objeto?: string;
  modalidad?: string;
  estado?: string;
  departamento?: string;
  ciudad?: string;
  unspsc?: string;
  publicadoDesde?: string;
  publicadoHasta?: string;
  cuantiaMin?: number;
  cuantiaMax?: number;
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();

  // Sin revalidatePath: esta acción no persiste nada, solo consulta Socrata
  // en vivo (ver ISecopLiveSearchThrottle en el backend, que limita cuántas
  // veces por organización se puede llamar en un lapso corto).
  return buscarEnVivo(params);
}

export async function promoverProcesoEnVivo(row: {
  dataset: string;
  secopId: string;
  title?: string | null;
  entityName?: string | null;
  entityNit?: string | null;
  subject?: string | null;
  modality?: string | null;
  status?: string | null;
  value?: number | null;
  publicationDate?: string | null;
  closingDate?: string | null;
  phase?: string | null;
  secopUrl?: string | null;
}) {
  await requireAuth();

  await apiFetch<unknown>("/secop/buscar-en-vivo/promover", {
    method: "POST",
    body: {
      dataset: row.dataset,
      secopId: row.secopId,
      title: row.title ?? null,
      entityName: row.entityName ?? null,
      entityNit: row.entityNit ?? null,
      subject: row.subject ?? null,
      modality: row.modality ?? null,
      status: row.status ?? null,
      value: row.value ?? null,
      publicationDate: row.publicationDate ?? null,
      closingDate: row.closingDate ?? null,
      phase: row.phase ?? null,
      secopUrl: row.secopUrl ?? null,
    },
  });

  revalidatePath("/secop");
  revalidatePath("/seguimiento");
  return { ok: true as const };
}

export async function descartarProcesoEnVivo(
  row: {
    dataset: string;
    secopId: string;
    title?: string | null;
    entityName?: string | null;
    entityNit?: string | null;
    subject?: string | null;
    modality?: string | null;
    status?: string | null;
    value?: number | null;
    publicationDate?: string | null;
    closingDate?: string | null;
    phase?: string | null;
    secopUrl?: string | null;
  },
  motivo?: string,
) {
  await requireAuth();

  await apiFetch<unknown>("/secop/buscar-en-vivo/descartar", {
    method: "POST",
    body: {
      dataset: row.dataset,
      secopId: row.secopId,
      title: row.title ?? null,
      entityName: row.entityName ?? null,
      entityNit: row.entityNit ?? null,
      subject: row.subject ?? null,
      modality: row.modality ?? null,
      status: row.status ?? null,
      value: row.value ?? null,
      publicationDate: row.publicationDate ?? null,
      closingDate: row.closingDate ?? null,
      phase: row.phase ?? null,
      secopUrl: row.secopUrl ?? null,
      motivo: motivo ?? null,
    },
  });

  revalidatePath("/secop");
  return { ok: true as const };
}
