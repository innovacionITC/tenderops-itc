"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nits } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

export async function createNit(input: { nit: string; descripcion?: string }) {
  const auth = await requireAuth(["administrador"]);
  const nit = z.string().trim().min(1).parse(input.nit);
  const descripcion = input.descripcion?.trim() || null;

  try {
    const [created] = await db
      .insert(nits)
      .values({ nit, descripcion, creadoPor: auth.userId, modificadoPor: auth.userId })
      .returning({ id: nits.id });

    await recordAudit(auth.userId, {
      action: "nit.create",
      module: "parametrica",
      entityType: "nit",
      entityId: created.id,
      metadata: { nit, descripcion },
    });

    revalidatePath("/admin/nits");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe ese NIT.");
    throw e;
  }
}

export async function updateNit(id: string, input: { nit: string; descripcion?: string }) {
  const auth = await requireAuth(["administrador"]);
  const nitId = z.uuid().parse(id);
  const nit = z.string().trim().min(1).parse(input.nit);
  const descripcion = input.descripcion?.trim() || null;

  try {
    await db
      .update(nits)
      .set({ nit, descripcion, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
      .where(eq(nits.id, nitId));

    await recordAudit(auth.userId, {
      action: "nit.update",
      module: "parametrica",
      entityType: "nit",
      entityId: nitId,
      metadata: { nit, descripcion },
    });

    revalidatePath("/admin/nits");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe ese NIT.");
    throw e;
  }
}

export async function setNitEstado(id: string, estado: boolean) {
  const auth = await requireAuth(["administrador"]);
  const nitId = z.uuid().parse(id);

  await db
    .update(nits)
    .set({ estado, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
    .where(eq(nits.id, nitId));

  await recordAudit(auth.userId, {
    action: "nit.set_estado",
    module: "parametrica",
    entityType: "nit",
    entityId: nitId,
    metadata: { estado },
  });

  revalidatePath("/admin/nits");
  revalidatePath("/admin/parametrica");
  return { ok: true };
}

export async function deleteNit(id: string) {
  const auth = await requireAuth(["administrador"]);
  const nitId = z.uuid().parse(id);

  const [existing] = await db
    .select({ nit: nits.nit })
    .from(nits)
    .where(eq(nits.id, nitId))
    .limit(1);

  await db.delete(nits).where(eq(nits.id, nitId));

  await recordAudit(auth.userId, {
    action: "nit.delete",
    module: "parametrica",
    entityType: "nit",
    entityId: nitId,
    metadata: { nit: existing?.nit ?? null },
  });

  revalidatePath("/admin/nits");
  revalidatePath("/admin/parametrica");
  return { ok: true };
}
