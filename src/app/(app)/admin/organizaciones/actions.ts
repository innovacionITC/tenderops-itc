"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { requireAuth } from "@/lib/auth/session";
import { createSchema } from "./schema";

function revalidateOrganizaciones() {
  revalidatePath("/admin/organizaciones");
}

export async function createOrganizacion(input: {
  nombre: string;
  email: string;
  phone: string;
  code: string;
  taxId?: string;
}) {
  await requireAuth(["superadmin"]);
  const parsed = createSchema.parse(input);

  await apiFetch<unknown>("/organizaciones", {
    method: "POST",
    body: {
      name: parsed.nombre,
      email: parsed.email,
      phone: parsed.phone,
      code: parsed.code,
      taxId: parsed.taxId || null,
    },
  });
  revalidateOrganizaciones();
  return { ok: true };
}

export async function updateOrganizacion(
  id: string,
  input: { nombre: string; email: string; phone: string; code: string; taxId?: string },
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
      code: parsed.code,
      taxId: parsed.taxId || null,
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
