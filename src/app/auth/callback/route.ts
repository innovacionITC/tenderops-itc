import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverEnv } from "@/env.server";
import { ApiError, apiFetch, persistSessionTokens, toSessionTokens } from "@/lib/api/client";
import { ENTRA_STATE_COOKIE, ENTRA_VERIFIER_COOKIE } from "@/lib/api/cookies";
import type { ApiSchemas } from "@/lib/api/types";

// Completa el authorization code flow (PKCE) contra Microsoft Entra que inició
// signInWithAzure(): intercambia el `code` por un id_token directamente con
// Entra y se lo postea a la API (POST /auth/sso/entra), que valida el token
// contra el JWKS de Entra y emite los tokens propios de la app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const next = searchParams.get("next") ?? "/dashboard";

  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get(ENTRA_VERIFIER_COOKIE)?.value;
  const expectedState = cookieStore.get(ENTRA_STATE_COOKIE)?.value;
  cookieStore.delete(ENTRA_VERIFIER_COOKIE);
  cookieStore.delete(ENTRA_STATE_COOKIE);

  const { MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET } = serverEnv;

  if (!MICROSOFT_TENANT_ID || !MICROSOFT_CLIENT_ID) {
    return fail("El inicio de sesión con Microsoft no está configurado.");
  }
  if (!code || !codeVerifier || !state || state !== expectedState) {
    // Causa típica: la cookie efímera del verifier/state (10 min, ver
    // signInWithAzure) expiró o no viajó — origen distinto entre el arranque
    // del flujo y el callback, tercera cookie bloqueada, o el usuario tardó
    // demasiado en Microsoft.
    console.error("[auth/callback] code/state/verifier inválido", {
      hasCode: Boolean(code),
      hasCodeVerifier: Boolean(codeVerifier),
      hasState: Boolean(state),
      stateMatches: state === expectedState,
    });
    return fail("No se pudo completar el inicio de sesión con Microsoft.");
  }

  // 1. Code → id_token, directamente contra Entra (el BFF guarda el verifier).
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/auth/callback`,
        code_verifier: codeVerifier,
        ...(MICROSOFT_CLIENT_SECRET ? { client_secret: MICROSOFT_CLIENT_SECRET } : {}),
      }),
      cache: "no-store",
    },
  );

  if (!tokenResponse.ok) {
    // El body de error de Entra (invalid_grant, invalid_client,
    // redirect_uri_mismatch...) no tiene secretos — es justo lo que hace
    // falta para saber qué está mal configurado.
    const body = await tokenResponse.text().catch(() => "(sin body)");
    console.error("[auth/callback] token endpoint de Entra respondió error", {
      status: tokenResponse.status,
      body,
      redirectUriEnviado: `${origin}/auth/callback`,
    });
    return fail("No se pudo completar el inicio de sesión con Microsoft.");
  }

  const { id_token: idToken } = (await tokenResponse.json()) as { id_token?: string };
  if (!idToken) {
    console.error("[auth/callback] Entra respondió 200 pero sin id_token en el body");
    return fail("No se pudo completar el inicio de sesión con Microsoft.");
  }

  // 2. id_token → tokens propios de la app, emitidos por la API.
  try {
    const tokens = await apiFetch<ApiSchemas["TokensResponse"]>("/auth/sso/entra", {
      method: "POST",
      body: { idToken },
    });
    await persistSessionTokens(toSessionTokens(tokens));
  } catch (e) {
    // P. ej. sso_account_not_provisioned: el detail de la API ya viene en
    // español. traceId permite buscar la request exacta en los logs de la API.
    console.error("[auth/callback] POST /auth/sso/entra falló", {
      status: e instanceof ApiError ? e.status : undefined,
      code: e instanceof ApiError ? e.code : undefined,
      detail: e instanceof ApiError ? e.detail : undefined,
      traceId: e instanceof ApiError ? e.traceId : undefined,
      error: e instanceof ApiError ? undefined : String(e),
    });
    const message =
      e instanceof ApiError && e.detail
        ? e.detail
        : "No se pudo completar el inicio de sesión con Microsoft.";
    return fail(message);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
