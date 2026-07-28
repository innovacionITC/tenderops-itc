"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { modalidades } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

export async function createModalidad(input: { descripcion: string; codigo?: string }) {
  const auth = await requireAuth(["administrador"]);
  const descripcion = z.string().trim().min(1).parse(input.descripcion);
  const codigo = input.codigo?.trim() || null;

  try {
    const [created] = await db
      .insert(modalidades)
      .values({ descripcion, codigo, creadoPor: auth.userId, modificadoPor: auth.userId })
      .returning({ id: modalidades.id });

    await recordAudit(auth.userId, {
      action: "modalidad.create",
      module: "parametrica",
      entityType: "modalidad",
      entityId: created.id,
      metadata: { descripcion, codigo },
    });

    revalidatePath("/admin/modalidades");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe una modalidad con ese código.");
    throw e;
  }
}

export async function updateModalidad(id: string, input: { descripcion: string; codigo?: string }) {
  const auth = await requireAuth(["administrador"]);
  const modalidadId = z.uuid().parse(id);
  const descripcion = z.string().trim().min(1).parse(input.descripcion);
  const codigo = input.codigo?.trim() || null;

  try {
    await db
      .update(modalidades)
      .set({ descripcion, codigo, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
      .where(eq(modalidades.id, modalidadId));

    await recordAudit(auth.userId, {
      action: "modalidad.update",
      module: "parametrica",
      entityType: "modalidad",
      entityId: modalidadId,
      metadata: { descripcion, codigo },
    });

    revalidatePath("/admin/modalidades");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe una modalidad con ese código.");
    throw e;
  }
}

export async function setModalidadEstado(id: string, estado: boolean) {
  const auth = await requireAuth(["administrador"]);
  const modalidadId = z.uuid().parse(id);

  await db
    .update(modalidades)
    .set({ estado, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
    .where(eq(modalidades.id, modalidadId));

  await recordAudit(auth.userId, {
    action: "modalidad.set_estado",
    module: "parametrica",
    entityType: "modalidad",
    entityId: modalidadId,
    metadata: { estado },
  });

  revalidatePath("/admin/modalidades");
  revalidatePath("/admin/parametrica");
  return { ok: true };
}

export async function deleteModalidad(id: string) {
  const auth = await requireAuth(["administrador"]);
  const modalidadId = z.uuid().parse(id);

  const [existing] = await db
    .select({ descripcion: modalidades.descripcion })
    .from(modalidades)
    .where(eq(modalidades.id, modalidadId))
    .limit(1);

  await db.delete(modalidades).where(eq(modalidades.id, modalidadId));

  await recordAudit(auth.userId, {
    action: "modalidad.delete",
    module: "parametrica",
    entityType: "modalidad",
    entityId: modalidadId,
    metadata: { descripcion: existing?.descripcion ?? null },
  });

  revalidatePath("/admin/modalidades");
  revalidatePath("/admin/parametrica");
  return { ok: true };
}
