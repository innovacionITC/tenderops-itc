"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appRole, perfiles, rolesUsuario } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

export async function updateUserRole(userId: string, role: string) {
  const auth = await requireAuth(["administrador"]);
  const id = z.uuid().parse(userId);
  const parsedRole = z.enum(appRole.enumValues).parse(role);

  if (id === auth.userId && parsedRole !== "administrador") {
    throw new Error("No puedes cambiar tu propio rol de administrador.");
  }

  const [existing] = await db
    .select({ id: rolesUsuario.id })
    .from(rolesUsuario)
    .where(eq(rolesUsuario.usuarioId, id))
    .limit(1);

  if (existing) {
    await db.update(rolesUsuario).set({ rol: parsedRole }).where(eq(rolesUsuario.id, existing.id));
  } else {
    await db.insert(rolesUsuario).values({ usuarioId: id, rol: parsedRole });
  }

  await recordAudit(auth.userId, {
    action: "user.role_update",
    module: "usuarios",
    entityType: "usuario",
    entityId: id,
    metadata: { role: parsedRole },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function setUserStatus(userId: string, active: boolean) {
  const auth = await requireAuth(["administrador"]);
  const id = z.uuid().parse(userId);

  if (id === auth.userId && !active) {
    throw new Error("No puedes desactivar tu propia cuenta.");
  }

  const estado = active ? "activo" : "inactivo";
  await db.update(perfiles).set({ estado }).where(eq(perfiles.id, id));

  await recordAudit(auth.userId, {
    action: "user.status_update",
    module: "usuarios",
    entityType: "usuario",
    entityId: id,
    metadata: { estado },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
