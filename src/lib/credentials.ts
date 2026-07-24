import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { credencialesApi } from "@/db/schema/schema";

const cache = new Map<string, { value: string | null; ts: number }>();
const TTL_MS = 30_000;

// Reads a credential from credenciales_api, falling back to process.env[key].
// Not a secret store for its own sake — used for values an admin manages at
// runtime (e.g. POWERBI_EMBED_URL) without a redeploy.
export async function getCredential(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.value;

  let dbValue: string | null = null;
  try {
    const [row] = await db
      .select({ value: credencialesApi.valor })
      .from(credencialesApi)
      .where(eq(credencialesApi.clave, key))
      .limit(1);
    dbValue = row?.value?.trim() || null;
  } catch (e) {
    console.warn(`[credentials] error leyendo ${key}`, e);
  }

  const value = dbValue ?? process.env[key] ?? null;
  cache.set(key, { value, ts: Date.now() });
  return value;
}

export type CredentialRow = {
  id: string;
  clave: string;
  hasValue: boolean;
  descripcion: string | null;
  fechaModificacion: string;
};

// Never returns `valor` — only whether it's set. Used by the admin screen so
// the raw secret never reaches the client (it would be serialized into the
// RSC payload regardless of how it's displayed).
export async function listCredentials(): Promise<CredentialRow[]> {
  const rows = await db
    .select({
      id: credencialesApi.id,
      clave: credencialesApi.clave,
      valor: credencialesApi.valor,
      descripcion: credencialesApi.descripcion,
      fechaModificacion: credencialesApi.fechaModificacion,
    })
    .from(credencialesApi)
    .orderBy(asc(credencialesApi.clave));

  return rows.map((r) => ({
    id: r.id,
    clave: r.clave,
    hasValue: !!r.valor?.trim(),
    descripcion: r.descripcion,
    fechaModificacion: r.fechaModificacion,
  }));
}
