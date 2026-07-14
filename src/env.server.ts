import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Optional here: only needed by lib/supabase/admin.ts, which isn't wired
  // into any page yet in this phase. Validated for real where it's used.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsed = serverEnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid server environment variables: ${z.prettifyError(parsed.error)}`);
}

export const serverEnv = parsed.data;
