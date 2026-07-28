"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entidades } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

export async function createEntidad(input: { nombre: string }) {
  const auth = await requireAuth(["administrador"]);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  try {
    const [created] = await db
      .insert(entidades)
      .values({ nombre, creadoPor: auth.userId, modificadoPor: auth.userId })
      .returning({ id: entidades.id });

    await recordAudit(auth.userId, {
      action: "entidad.create",
      module: "parametrica",
      entityType: "entidad",
      entityId: created.id,
      metadata: { nombre },
    });

    revalidatePath("/admin/entidades");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe esa entidad.");
    throw e;
  }
}

export async function updateEntidad(id: string, input: { nombre: string }) {
  const auth = await requireAuth(["administrador"]);
  const entidadId = z.uuid().parse(id);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  try {
    await db
      .update(entidades)
      .set({ nombre, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
      .where(eq(entidades.id, entidadId));

    await recordAudit(auth.userId, {
      action: "entidad.update",
      module: "parametrica",
      entityType: "entidad",
      entityId: entidadId,
      metadata: { nombre },
    });

    revalidatePath("/admin/entidades");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe esa entidad.");
    throw e;
  }
}

export async function setEntidadEstado(id: string, estado: boolean) {
  const auth = await requireAuth(["administrador"]);
  const entidadId = z.uuid().parse(id);

  await db
    .update(entidades)
    .set({ estado, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
    .where(eq(entidades.id, entidadId));

  await recordAudit(auth.userId, {
    action: "entidad.set_estado",
    module: "parametrica",
    entityType: "entidad",
    entityId: entidadId,
    metadata: { estado },
  });

  revalidatePath("/admin/entidades");
  revalidatePath("/admin/parametrica");
  return { ok: true };
}

export async function deleteEntidad(id: string) {
  const auth = await requireAuth(["administrador"]);
  const entidadId = z.uuid().parse(id);

  const [existing] = await db
    .select({ nombre: entidades.nombre })
    .from(entidades)
    .where(eq(entidades.id, entidadId))
    .limit(1);

  await db.delete(entidades).where(eq(entidades.id, entidadId));

  await recordAudit(auth.userId, {
    action: "entidad.delete",
    module: "parametrica",
    entityType: "entidad",
    entityId: entidadId,
    metadata: { nombre: existing?.nombre ?? null },
  });

  revalidatePath("/admin/entidades");
  revalidatePath("/admin/parametrica");
  return { ok: true };
}
