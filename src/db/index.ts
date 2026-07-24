import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/env.server";
import * as schema from "./schema/schema";
import * as relations from "./schema/relations";

// En dev, cada Fast Refresh de un módulo que importe este archivo re-ejecuta
// este módulo y crearía un pool de conexiones nuevo sin cerrar el anterior,
// agotando el límite del pooler de Supabase ("max clients reached in session
// mode"). Cachear el cliente en globalThis hace que sobreviva a los reloads.
const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.postgresClient ?? postgres(serverEnv.DATABASE_URL, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema: { ...schema, ...relations } });
