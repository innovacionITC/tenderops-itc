import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiCredentials } from "@/db/schema/schema";

const cache = new Map<string, { value: string | null; ts: number }>();
const TTL_MS = 30_000;

// Reads a credential from api_credentials, falling back to process.env[key].
// Not a secret store for its own sake — used for values an admin manages at
// runtime (e.g. POWERBI_EMBED_URL) without a redeploy.
export async function getCredential(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.value;

  let dbValue: string | null = null;
  try {
    const [row] = await db
      .select({ value: apiCredentials.value })
      .from(apiCredentials)
      .where(eq(apiCredentials.key, key))
      .limit(1);
    dbValue = row?.value?.trim() || null;
  } catch (e) {
    console.warn(`[credentials] error leyendo ${key}`, e);
  }

  const value = dbValue ?? process.env[key] ?? null;
  cache.set(key, { value, ts: Date.now() });
  return value;
}
