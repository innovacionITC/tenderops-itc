"use server";

import { cookies } from "next/headers";
import { ApiError, apiFetch, persistSessionTokens, toSessionTokens } from "@/lib/api/client";
import { REFRESH_TOKEN_COOKIE } from "@/lib/api/cookies";
import type { ApiSchemas } from "@/lib/api/types";

export async function switchOrganization(organizationId: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return { error: "No hay sesión activa." };
  }

  try {
    const tokens = await apiFetch<ApiSchemas["TokensResponse"]>("/auth/switch-organization", {
      method: "POST",
      body: { refreshToken, organizationId },
    });

    await persistSessionTokens(toSessionTokens(tokens));
    return {};
  } catch (e) {
    if (e instanceof ApiError) {
      return { error: e.detail ?? "No se pudo cambiar de organización." };
    }
    return { error: "No se pudo cambiar de organización. Intenta de nuevo." };
  }
}
