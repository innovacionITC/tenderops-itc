"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  parametricaParametros,
  palabrasClave,
  modalidadParametros,
  modalidades,
  entidadesParametros,
  entidades,
  estadoSecopParametros,
  estadosSecop,
  unspscParametros,
} from "@/db/schema/schema";
import { requireAuth } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

const saveSchema = z
  .object({
    habilitado: z.boolean(),
    datasetSecopI: z.boolean(),
    datasetSecopIi: z.boolean(),
    diasHaciaAtras: z.number().int().positive(),
    intervalosCronMin: z.number().int().positive(),
    maxResultadosConsulta: z.number().int().positive(),
    valorMinimo: z.number().nullable(),
    valorMaximo: z.number().nullable(),
    palabrasClave: z.array(z.string().trim().min(1)).max(200),
    modalidadIds: z.array(z.uuid()),
    entidadIds: z.array(z.uuid()),
    estadoSecopIds: z.array(z.uuid()),
    unspscIds: z.array(z.uuid()),
  })
  .refine(
    (v) => v.valorMinimo == null || v.valorMaximo == null || v.valorMinimo <= v.valorMaximo,
    { message: "El valor mínimo no puede ser mayor que el valor máximo.", path: ["valorMinimo"] },
  );

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}

export async function saveParametricaConfig(input: z.infer<typeof saveSchema>) {
  const auth = await requireAuth(["administrador"]);
  const data = saveSchema.parse(input);

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: parametricaParametros.id }).from(parametricaParametros).limit(1);

    let id: string;
    let wasCreated = false;
    if (existing) {
      id = existing.id;
      await tx
        .update(parametricaParametros)
        .set({
          habilitado: data.habilitado,
          datasetSecopI: data.datasetSecopI,
          datasetSecopIi: data.datasetSecopIi,
          diasHaciaAtras: data.diasHaciaAtras,
          intervalosCronMin: data.intervalosCronMin,
          maxResultadosConsulta: data.maxResultadosConsulta,
          valorMinimo: data.valorMinimo?.toString() ?? null,
          valorMaximo: data.valorMaximo?.toString() ?? null,
          modificadoPor: auth.userId,
          fechaModificacion: new Date().toISOString(),
        })
        .where(eq(parametricaParametros.id, id));
    } else {
      wasCreated = true;
      const [created] = await tx
        .insert(parametricaParametros)
        .values({
          habilitado: data.habilitado,
          datasetSecopI: data.datasetSecopI,
          datasetSecopIi: data.datasetSecopIi,
          diasHaciaAtras: data.diasHaciaAtras,
          intervalosCronMin: data.intervalosCronMin,
          maxResultadosConsulta: data.maxResultadosConsulta,
          valorMinimo: data.valorMinimo?.toString() ?? null,
          valorMaximo: data.valorMaximo?.toString() ?? null,
          creadoPor: auth.userId,
          modificadoPor: auth.userId,
        })
        .returning({ id: parametricaParametros.id });
      id = created.id;
    }

    await tx.delete(palabrasClave).where(eq(palabrasClave.parametricaParametrosId, id));
    if (data.palabrasClave.length > 0) {
      await tx.insert(palabrasClave).values(
        Array.from(new Set(data.palabrasClave)).map((palabraClave) => ({
          parametricaParametrosId: id,
          palabraClave,
          creadoPor: auth.userId,
          modificadoPor: auth.userId,
        })),
      );
    }

    await tx.delete(modalidadParametros).where(eq(modalidadParametros.parametricaParametrosId, id));
    if (data.modalidadIds.length > 0) {
      await tx
        .insert(modalidadParametros)
        .values(data.modalidadIds.map((modalidadId) => ({ parametricaParametrosId: id, modalidadId })));
    }

    await tx.delete(entidadesParametros).where(eq(entidadesParametros.parametricaParametrosId, id));
    if (data.entidadIds.length > 0) {
      await tx
        .insert(entidadesParametros)
        .values(data.entidadIds.map((entidadId) => ({ parametricaParametrosId: id, entidadId })));
    }

    await tx.delete(estadoSecopParametros).where(eq(estadoSecopParametros.parametricaParametrosId, id));
    if (data.estadoSecopIds.length > 0) {
      await tx
        .insert(estadoSecopParametros)
        .values(data.estadoSecopIds.map((estadoSecopId) => ({ parametricaParametrosId: id, estadoSecopId })));
    }

    await tx.delete(unspscParametros).where(eq(unspscParametros.parametricaParametrosId, id));
    if (data.unspscIds.length > 0) {
      await tx
        .insert(unspscParametros)
        .values(data.unspscIds.map((codigoUnspscId) => ({ parametricaParametrosId: id, codigoUnspscId })));
    }

    return { id, wasCreated };
  });

  await recordAudit(auth.userId, {
    action: "parametrica.update",
    module: "parametrica",
    entityType: "parametrica_parametros",
    entityId: result.id,
    metadata: {
      wasCreated: result.wasCreated,
      keywordCount: data.palabrasClave.length,
      modalidadCount: data.modalidadIds.length,
      entidadCount: data.entidadIds.length,
      estadoSecopCount: data.estadoSecopIds.length,
      unspscCount: data.unspscIds.length,
    },
  });

  revalidatePath("/admin/parametrica");
  return { ok: true };
}

export async function quickAddModalidad(input: { descripcion: string; codigo?: string }) {
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
      metadata: { descripcion },
    });

    revalidatePath("/admin/parametrica");
    return { id: created.id, label: descripcion };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe esa modalidad.");
    throw e;
  }
}

export async function quickAddEntidad(input: { nombre: string }) {
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

    revalidatePath("/admin/parametrica");
    return { id: created.id, label: nombre };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe esa entidad.");
    throw e;
  }
}

export async function quickAddEstadoSecop(input: { nombre: string }) {
  const auth = await requireAuth(["administrador"]);
  const nombre = z.string().trim().min(1).parse(input.nombre);

  try {
    const [created] = await db
      .insert(estadosSecop)
      .values({ nombre, creadoPor: auth.userId, modificadoPor: auth.userId })
      .returning({ id: estadosSecop.id });

    await recordAudit(auth.userId, {
      action: "estado_secop.create",
      module: "parametrica",
      entityType: "estado_secop",
      entityId: created.id,
      metadata: { nombre },
    });

    revalidatePath("/admin/parametrica");
    return { id: created.id, label: nombre };
  } catch (e) {
    if (isUniqueViolation(e)) throw new Error("Ya existe ese estado SECOP.");
    throw e;
  }
}
