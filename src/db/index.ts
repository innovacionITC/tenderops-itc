import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/env.server";
import * as schema from "./schema/schema";
import * as relations from "./schema/relations";

const client = postgres(serverEnv.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema: { ...schema, ...relations } });
