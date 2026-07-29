import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import { APP_ROLES, hasAnyRole, type AppRole } from "./roles";

export interface AuthContext {
  userId: string;
  email: string | null;
  role: AppRole | null;
}

function toAppRole(role: string | null): AppRole | null {
  return (APP_ROLES as readonly string[]).includes(role ?? "") ? (role as AppRole) : null;
}

// Memoized per-request (React `cache`): safe to call from many Server
// Components/Actions in the same render without re-hitting GET /auth/me.
// Un 401 (sin token, token vencido irrecuperable o cuenta desactivada — la
// API trata perfil inactivo como "sin sesión") se traduce a `null`.
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  try {
    const me = await apiFetch<ApiSchemas["MeResponse"]>("/auth/me");
    return { userId: me.userId, email: me.email, role: toAppRole(me.role) };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
});

/**
 * Data Access Layer entry point for Server Components, Server Actions, and
 * Route Handlers. Redirects to /login if there's no session; throws if
 * `allowedRoles` is given and the user's role isn't in it. La firma no cambió
 * en la Fase 7 a propósito: las ~40 llamadas existentes siguen compilando.
 * La autorización de verdad la re-verifica la API en cada endpoint (policies);
 * este chequeo local solo corta antes y con mejor UX.
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
