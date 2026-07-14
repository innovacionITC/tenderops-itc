import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles } from "@/db/schema/schema";
import { createClient } from "@/lib/supabase/server";
import { hasAnyRole, type AppRole } from "./roles";

export interface AuthContext {
  userId: string;
  email: string | null;
  role: AppRole | null;
}

// Memoized per-request (React `cache`): safe to call from many Server
// Components/Actions in the same render without re-querying Supabase/Postgres.
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [roleRow] = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id))
    .limit(1);

  return { userId: user.id, email: user.email ?? null, role: roleRow?.role ?? "lectura" };
});

/**
 * Data Access Layer entry point for Server Components, Server Actions, and
 * Route Handlers. Redirects to /login if there's no session; throws if
 * `allowedRoles` is given and the user's role isn't in it. This — not
 * Postgres RLS — is where authorization is enforced, since Drizzle connects
 * with a direct (non-impersonated) connection. See the plan doc for why.
 */
export async function requireAuth(allowedRoles?: AppRole[]): Promise<AuthContext> {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (allowedRoles && !hasAnyRole(auth.role, allowedRoles)) {
    throw new Error("No tienes permisos para realizar esta acción.");
  }

  return auth;
}
