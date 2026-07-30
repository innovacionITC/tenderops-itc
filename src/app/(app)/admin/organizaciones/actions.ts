"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { nitSchema } from "../nits/schema";
import { createSchema } from "./schema";

function revalidateOrganizaciones() {
  revalidatePath("/admin/organizaciones");
}

export async function createNitQuick(input: { nit: string; descripcion: string }) {
  await requireAuth(["superadmin"]);
  const { nit, descripcion } = nitSchema.parse(input);

  const created = await apiFetch<{ id: string; nit: string; description: string | null }>(
    "/nits",
    { method: "POST", body: { nit, description: descripcion } },
  );
  revalidateOrganizaciones();
  return { id: created.id, label: created.description ? `${created.nit} — ${created.description}` : created.nit };
}

export async function createOrganizacion(input: {
  nombre: string;
  email: string;
  phone: string;
  nitId: string;
}) {
  await requireAuth(["superadmin"]);
  const parsed = createSchema.parse(input);

  await apiFetch<unknown>("/organizaciones", {
    method: "POST",
    body: {
      name: parsed.nombre,
      email: parsed.email,
      phone: parsed.phone,
      nitId: parsed.nitId,
    },
  });
  revalidateOrganizaciones();
  return { ok: true };
}

export async function updateOrganizacion(
  id: string,
  input: { nombre: string; email: string; phone: string; nitId: string },
) {
  await requireAuth(["superadmin"]);
  const orgId = z.uuid().parse(id);
  const parsed = createSchema.parse(input);

  await apiFetch<unknown>(`/organizaciones/${orgId}`, {
    method: "PUT",
    body: {
      name: parsed.nombre,
      email: parsed.email,
      phone: parsed.phone,
      nitId: parsed.nitId,
    },
  });
  revalidateOrganizaciones();
  return { ok: true };
}

export async function setOrganizacionEstado(id: string, estado: boolean) {
  await requireAuth(["superadmin"]);
  const orgId = z.uuid().parse(id);

  await apiFetch<unknown>(`/organizaciones/${orgId}/estado`, {
    method: "PATCH",
    body: { isActive: estado },
  });
  revalidateOrganizaciones();
  return { ok: true };
}

export async function deleteOrganizacion(id: string) {
  await requireAuth(["superadmin"]);
  const orgId = z.uuid().parse(id);

  await apiFetch<unknown>(`/organizaciones/${orgId}`, { method: "DELETE" });
  revalidateOrganizaciones();
  return { ok: true };
}
