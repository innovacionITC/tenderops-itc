"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { credencialesApi } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

const claveSchema = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]*$/, "Usa MAYÚSCULAS_CON_GUION_BAJO");

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

export async function createCredential(input: {
  clave: string;
  valor: string;
  descripcion?: string;
}) {
  const auth = await requireAuth(["administrador"]);
  const clave = claveSchema.parse(input.clave);
  const valor = z.string().trim().min(1).parse(input.valor);
  const descripcion = input.descripcion?.trim() || null;

  try {
    const [created] = await db
      .insert(credencialesApi)
      .values({ clave, valor, descripcion, modificadoPor: auth.userId })
      .returning({ id: credencialesApi.id });

    await recordAudit(auth.userId, {
      action: "credential.create",
      module: "credenciales",
      entityType: "credencial_api",
      entityId: created.id,
      metadata: { clave },
    });

    revalidatePath("/admin/credenciales");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe una credencial con esa clave.");
    throw e;
  }
}

export async function updateCredential(id: string, input: { valor?: string; descripcion?: string }) {
  const auth = await requireAuth(["administrador"]);
  const credentialId = z.uuid().parse(id);

  const [existing] = await db
    .select({ id: credencialesApi.id, clave: credencialesApi.clave })
    .from(credencialesApi)
    .where(eq(credencialesApi.id, credentialId))
    .limit(1);
  if (!existing) throw new Error("Credencial no encontrada.");

  const valor = input.valor?.trim();
  await db
    .update(credencialesApi)
    .set({
      ...(valor ? { valor } : {}),
      descripcion: input.descripcion?.trim() || null,
      modificadoPor: auth.userId,
      fechaModificacion: new Date().toISOString(),
    })
    .where(eq(credencialesApi.id, credentialId));

  await recordAudit(auth.userId, {
    action: "credential.update",
    module: "credenciales",
    entityType: "credencial_api",
    entityId: credentialId,
    metadata: { clave: existing.clave, valorChanged: !!valor },
  });

  revalidatePath("/admin/credenciales");
  return { ok: true };
}

export async function deleteCredential(id: string) {
  const auth = await requireAuth(["administrador"]);
  const credentialId = z.uuid().parse(id);

  const [existing] = await db
    .select({ clave: credencialesApi.clave })
    .from(credencialesApi)
    .where(eq(credencialesApi.id, credentialId))
    .limit(1);

  await db.delete(credencialesApi).where(eq(credencialesApi.id, credentialId));

  await recordAudit(auth.userId, {
    action: "credential.delete",
    module: "credenciales",
    entityType: "credencial_api",
    entityId: credentialId,
    metadata: { clave: existing?.clave ?? null },
  });

  revalidatePath("/admin/credenciales");
  return { ok: true };
}
