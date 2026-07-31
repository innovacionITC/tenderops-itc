"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiFetch, persistSessionTokens, toSessionTokens } from "@/lib/api/client";
import { REFRESH_TOKEN_COOKIE } from "@/lib/api/cookies";
import type { ApiSchemas } from "@/lib/api/types";

export async function switchOrganization(organizationId: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return { error: "No hay sesión activa." };
  }

  let tokens: ApiSchemas["TokensResponse"];
  try {
    tokens = await apiFetch<ApiSchemas["TokensResponse"]>("/auth/switch-organization", {
      method: "POST",
      body: { refreshToken, organizationId },
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return { error: e.detail ?? "No se pudo cambiar de organización." };
    }
    return { error: "No se pudo cambiar de organización. Intenta de nuevo." };
  }

  await persistSessionTokens(toSessionTokens(tokens));
  redirect("/dashboard");
}
