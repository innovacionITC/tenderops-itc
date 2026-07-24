"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { codigosUnspsc } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

export async function createUnspscCode(input: { codigo: string; descripcion?: string }) {
  const auth = await requireAuth(["administrador"]);
  const codigo = z.string().trim().min(1).parse(input.codigo);
  const descripcion = input.descripcion?.trim() || null;

  try {
    const [created] = await db
      .insert(codigosUnspsc)
      .values({ codigo, descripcion })
      .returning({ id: codigosUnspsc.id });

    await recordAudit(auth.userId, {
      action: "unspsc.create",
      module: "unspsc",
      entityType: "codigo_unspsc",
      entityId: created.id,
      metadata: { codigo },
    });

    revalidatePath("/admin/unspsc");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe ese código UNSPSC.");
    throw e;
  }
}

export async function updateUnspscCode(id: string, input: { codigo?: string; descripcion?: string }) {
  const auth = await requireAuth(["administrador"]);
  const codeId = z.uuid().parse(id);

  try {
    await db
      .update(codigosUnspsc)
      .set({
        ...(input.codigo ? { codigo: input.codigo.trim() } : {}),
        descripcion: input.descripcion?.trim() || null,
      })
      .where(eq(codigosUnspsc.id, codeId));

    await recordAudit(auth.userId, {
      action: "unspsc.update",
      module: "unspsc",
      entityType: "codigo_unspsc",
      entityId: codeId,
      metadata: { codigo: input.codigo },
    });

    revalidatePath("/admin/unspsc");
    revalidatePath("/admin/parametrica");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe ese código UNSPSC.");
    throw e;
  }
}

export async function deleteUnspscCode(id: string) {
  const auth = await requireAuth(["administrador"]);
  const codeId = z.uuid().parse(id);

  const [existing] = await db
    .select({ codigo: codigosUnspsc.codigo })
    .from(codigosUnspsc)
    .where(eq(codigosUnspsc.id, codeId))
    .limit(1);

  await db.delete(codigosUnspsc).where(eq(codigosUnspsc.id, codeId));

  await recordAudit(auth.userId, {
    action: "unspsc.delete",
    module: "unspsc",
    entityType: "codigo_unspsc",
    entityId: codeId,
    metadata: { codigo: existing?.codigo ?? null },
  });

  revalidatePath("/admin/unspsc");
  revalidatePath("/admin/parametrica");
  return { ok: true };
}
