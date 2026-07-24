import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { codigosUnspsc } from "@/db/schema/schema";

export type UnspscRow = { id: string; codigo: string; descripcion: string | null };

export async function listUnspscCodes(): Promise<UnspscRow[]> {
  return db
    .select({ id: codigosUnspsc.id, codigo: codigosUnspsc.codigo, descripcion: codigosUnspsc.descripcion })
    .from(codigosUnspsc)
    .orderBy(asc(codigosUnspsc.codigo));
}
