"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { APP_ROLES } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { createUsuarioSchema } from "./schema";

// Los guardarraíles ("no puedes cambiar tu propio rol/desactivarte") ahora los
// aplica la API como 409 (rol_propio_protegido / cuenta_propia_protegida) con
// `detail` en español, que burbujea como message. Ambas mutaciones incrementan
// token_version en la API: el refresh siguiente del usuario afectado falla.

export async function updateUserRole(userId: string, role: string) {
  await requireAuth(["administrador"]);
  const id = z.uuid().parse(userId);
  const parsedRole = z.enum(APP_ROLES).parse(role);

  await apiFetch<unknown>(`/usuarios/${id}/rol`, { method: "PUT", body: { role: parsedRole } });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function setUserStatus(userId: string, active: boolean) {
  await requireAuth(["administrador"]);
  const id = z.uuid().parse(userId);

  await apiFetch<unknown>(`/usuarios/${id}/estado`, { method: "PUT", body: { active } });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function updateUserOrganizaciones(userId: string, organizacionIds: string[]) {
  await requireAuth(["administrador"]);
  const id = z.uuid().parse(userId);
  const orgIds = z.array(z.uuid()).parse(organizacionIds);

  await apiFetch<unknown>(`/usuarios/${id}/organizaciones`, {
    method: "PUT",
    body: { organizacionIds: orgIds },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function createUsuario(input: unknown) {
  await requireAuth(["administrador"]);
  const parsed = createUsuarioSchema.parse(input);

  await apiFetch<unknown>("/usuarios", {
    method: "POST",
    body: {
      fullName: parsed.fullName,
      email: parsed.email,
      password: parsed.password || null,
      role: parsed.role,
      organizacionIds: parsed.organizacionIds,
    },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
