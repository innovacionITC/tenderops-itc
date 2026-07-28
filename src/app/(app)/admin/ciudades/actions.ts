"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ciudades } from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

function isForeignKeyViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23503";
}

function revalidateUbicaciones() {
  revalidatePath("/admin/ciudades");
  revalidatePath("/admin/departamentos");
  revalidatePath("/admin/parametrica");
}

const ciudadInput = z.object({
  nombre: z.string().trim().min(1),
  departamentoId: z.uuid(),
});

export async function createCiudad(input: { nombre: string; departamentoId: string }) {
  const auth = await requireAuth(["administrador"]);
  const data = ciudadInput.parse(input);

  try {
    const [created] = await db
      .insert(ciudades)
      .values({
        nombre: data.nombre,
        departamentoId: data.departamentoId,
        creadoPor: auth.userId,
        modificadoPor: auth.userId,
      })
      .returning({ id: ciudades.id });

    await recordAudit(auth.userId, {
      action: "ciudad.create",
      module: "parametrica",
      entityType: "ciudad",
      entityId: created.id,
      metadata: { nombre: data.nombre, departamentoId: data.departamentoId },
    });

    revalidateUbicaciones();
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe esa ciudad en ese departamento.");
    if (isForeignKeyViolation(e)) throw new Error("El departamento seleccionado no existe.");
    throw e;
  }
}

export async function updateCiudad(id: string, input: { nombre: string; departamentoId: string }) {
  const auth = await requireAuth(["administrador"]);
  const ciudadId = z.uuid().parse(id);
  const data = ciudadInput.parse(input);

  try {
    await db
      .update(ciudades)
      .set({
        nombre: data.nombre,
        departamentoId: data.departamentoId,
        modificadoPor: auth.userId,
        fechaModificacion: new Date().toISOString(),
      })
      .where(eq(ciudades.id, ciudadId));

    await recordAudit(auth.userId, {
      action: "ciudad.update",
      module: "parametrica",
      entityType: "ciudad",
      entityId: ciudadId,
      metadata: { nombre: data.nombre, departamentoId: data.departamentoId },
    });

    revalidateUbicaciones();
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe esa ciudad en ese departamento.");
    if (isForeignKeyViolation(e)) throw new Error("El departamento seleccionado no existe.");
    throw e;
  }
}

export async function setCiudadEstado(id: string, estado: boolean) {
  const auth = await requireAuth(["administrador"]);
  const ciudadId = z.uuid().parse(id);

  await db
    .update(ciudades)
    .set({ estado, modificadoPor: auth.userId, fechaModificacion: new Date().toISOString() })
    .where(eq(ciudades.id, ciudadId));

  await recordAudit(auth.userId, {
    action: "ciudad.set_estado",
    module: "parametrica",
    entityType: "ciudad",
    entityId: ciudadId,
    metadata: { estado },
  });

  revalidateUbicaciones();
  return { ok: true };
}

export async function deleteCiudad(id: string) {
  const auth = await requireAuth(["administrador"]);
  const ciudadId = z.uuid().parse(id);

  const [existing] = await db
    .select({ nombre: ciudades.nombre })
    .from(ciudades)
    .where(eq(ciudades.id, ciudadId))
    .limit(1);

  await db.delete(ciudades).where(eq(ciudades.id, ciudadId));

  await recordAudit(auth.userId, {
    action: "ciudad.delete",
    module: "parametrica",
    entityType: "ciudad",
    entityId: ciudadId,
    metadata: { nombre: existing?.nombre ?? null },
  });

  revalidateUbicaciones();
  return { ok: true };
}
