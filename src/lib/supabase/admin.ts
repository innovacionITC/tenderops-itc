import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";
import { serverEnv } from "@/env.server";

// Service-role client — bypasses RLS. Only for trusted, server-only operations
// that cannot be expressed through Drizzle + requireAuth() (e.g. Supabase Auth
// admin APIs like inviting/deleting users). Never import this in client code.
export function createAdminClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — required to use the admin client.");
  }

  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
