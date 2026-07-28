"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { departamentos } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

function revalidateUbicaciones() {
  revalidatePath("/admin/departamentos");
  revalidatePath("/admin/ciudades");
  revalidatePath("/admin/parametrica");
}

export async function createDepartamento(input: { nombre: string }) {
  const auth = await requireAuth(["administrador"]);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  try {
    const [created] = await db
      .insert(departamentos)
      .values({ nombre, creadoPor: auth.userId, modificadoPor: auth.userId })
      .returning({ id: departamentos.id });

    await recordAudit(auth.userId, {
      action: "departamento.create",
      module: "parametrica",
      entityType: "departamento",
      entityId: created.id,
      metadata: { nombre },
    });

    revalidateUbicaciones();
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe ese departamento.");
    throw e;
  }
}

export async function updateDepartamento(id: string, input: { nombre: string }) {
  const auth = await requireAuth(["administrador"]);
  const departamentoId = z.uuid().parse(id);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  try {
    await db
      .update(departamentos)
      .set({ nombre, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
      .where(eq(departamentos.id, departamentoId));

    await recordAudit(auth.userId, {
      action: "departamento.update",
      module: "parametrica",
      entityType: "departamento",
      entityId: departamentoId,
      metadata: { nombre },
    });

    revalidateUbicaciones();
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe ese departamento.");
    throw e;
  }
}

export async function setDepartamentoEstado(id: string, estado: boolean) {
  const auth = await requireAuth(["administrador"]);
  const departamentoId = z.uuid().parse(id);

  await db
    .update(departamentos)
    .set({ estado, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
    .where(eq(departamentos.id, departamentoId));

  await recordAudit(auth.userId, {
    action: "departamento.set_estado",
    module: "parametrica",
    entityType: "departamento",
    entityId: departamentoId,
    metadata: { estado },
  });

  revalidateUbicaciones();
  return { ok: true };
}

export async function deleteDepartamento(id: string) {
  const auth = await requireAuth(["administrador"]);
  const departamentoId = z.uuid().parse(id);

  const [existing] = await db
    .select({ nombre: departamentos.nombre })
    .from(departamentos)
    .where(eq(departamentos.id, departamentoId))
    .limit(1);

  await db.delete(departamentos).where(eq(departamentos.id, departamentoId));

  await recordAudit(auth.userId, {
    action: "departamento.delete",
    module: "parametrica",
    entityType: "departamento",
    entityId: departamentoId,
    metadata: { nombre: existing?.nombre ?? null },
  });

  revalidateUbicaciones();
  return { ok: true };
}
