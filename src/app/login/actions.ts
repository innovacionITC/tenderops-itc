"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { serverEnv } from "@/env.server";
import {
  ApiError,
  apiFetch,
  clearSessionTokens,
  persistSessionTokens,
  toSessionTokens,
} from "@/lib/api/client";
import {
  ENTRA_STATE_COOKIE,
  ENTRA_VERIFIER_COOKIE,
  REFRESH_TOKEN_COOKIE,
  sessionCookieOptions,
} from "@/lib/api/cookies";
import type { ApiSchemas } from "@/lib/api/types";

const loginSchema = z.object({
  email: z.email({ error: "Correo inválido." }),
  password: z.string().min(1, { error: "La contraseña es obligatoria." }),
});

export interface LoginState {
  error?: string;
  email?: string;
}

// La API responde ProblemDetails con `detail` ya en español (AuthErrors usa
// los mismos códigos estables que usaba Supabase). El detail es el mensaje;
// esto cubre solo los casos donde no llega ninguno.
function loginErrorMessage(e: ApiError): string {
  if (e.status === 429) return "Demasiados intentos. Intenta de nuevo en unos minutos.";
  return e.detail ?? "No se pudo iniciar sesión. Intenta de nuevo.";
}

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos.", email };
  }

  let tokens: ApiSchemas["TokensResponse"];
  try {
    tokens = await apiFetch<ApiSchemas["TokensResponse"]>("/auth/login", {
      method: "POST",
      body: { email: parsed.data.email, password: parsed.data.password },
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return { error: loginErrorMessage(e), email };
    }
    // API inalcanzable (fetch falló antes de tener respuesta).
    return { error: "No se pudo iniciar sesión. Intenta de nuevo.", email };
  }

  await persistSessionTokens(toSessionTokens(tokens));
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    // Best-effort: revoca la familia de refresh tokens en la API. Si la API
    // no responde, las cookies se borran igual y la sesión local muere.
    try {
      await apiFetch<void>("/auth/logout", { method: "POST", body: { refreshToken } });
    } catch {
      // nada que hacer: el refresh expirará solo en la API
    }
  }

  await clearSessionTokens();
  redirect("/login");
}

// ── SSO con Microsoft Entra ID ──────────────────────────────────────────────
// El BFF hace el authorization code flow con PKCE directamente contra Entra
// (ya no pasa por Supabase). El callback (/auth/callback) intercambia el code
// por un id_token y se lo postea a la API (POST /auth/sso/entra).

const OAUTH_COOKIE_MAX_AGE = 10 * 60;

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export async function signInWithAzure() {
  const { MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID } = serverEnv;
  if (!MICROSOFT_TENANT_ID || !MICROSOFT_CLIENT_ID) {
    redirect(
      `/login?error=${encodeURIComponent("El inicio de sesión con Microsoft no está configurado.")}`,
    );
  }

  const origin = (await headers()).get("origin");
  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());
  const state = base64url(randomBytes(16));

  const cookieStore = await cookies();
  cookieStore.set(ENTRA_VERIFIER_COOKIE, codeVerifier, sessionCookieOptions(OAUTH_COOKIE_MAX_AGE));
  cookieStore.set(ENTRA_STATE_COOKIE, state, sessionCookieOptions(OAUTH_COOKIE_MAX_AGE));

  const authorizeUrl = new URL(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
  );
  authorizeUrl.searchParams.set("client_id", MICROSOFT_CLIENT_ID);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", `${origin}/auth/callback`);
  authorizeUrl.searchParams.set("response_mode", "query");
  authorizeUrl.searchParams.set("scope", "openid profile email");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  redirect(authorizeUrl.toString());
}
