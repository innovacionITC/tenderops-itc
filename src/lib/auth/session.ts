import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import { APP_ROLES, hasAnyRole, type AppRole } from "./roles";

export interface OrganizationSummary {
  id: string;
  name: string;
  code: string;
}

export interface AuthContext {
  userId: string;
  email: string | null;
  role: AppRole | null;
  activeOrganizationId: string;
  activeOrganizationName: string;
  activeOrganizationCode: string;
  organizations: OrganizationSummary[];
}

function toAppRole(role: string | null): AppRole | null {
  return (APP_ROLES as readonly string[]).includes(role ?? "") ? (role as AppRole) : null;
}

export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  try {
    const me = await apiFetch<ApiSchemas["MeResponse"]>("/auth/me");
    return {
      userId: me.userId,
      email: me.email,
      role: toAppRole(me.role),
      activeOrganizationId: me.activeOrganizationId,
      activeOrganizationName: me.activeOrganizationName,
      activeOrganizationCode: me.activeOrganizationCode,
      organizations: me.organizations.map((o) => ({ id: o.id, name: o.name, code: o.code })),
    };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
});

/**
 * Data Access Layer entry point for Server Components, Server Actions, and
 * Route Handlers. Redirects to /login if there's no session; throws if
 * `allowedRoles` is given and the user's role isn't in it.
 */
export async function requireAuth(allowedRoles?: AppRole[]): Promise<AuthContext> {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (allowedRoles && !hasAnyRole(auth.role, allowedRoles)) {
    redirect("/unauthorized");
  }

  return auth;
}
