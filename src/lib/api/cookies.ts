// Nombres y opciones de las cookies de sesión propias (Fase 7 del plan .NET).
// Sin "server-only" a propósito: src/proxy.ts también las importa y el proxy
// no participa del grafo de módulos RSC.

/** Access token JWT de la API. Su Max-Age coincide con el `expiresIn` del
 * token (15 min): cuando el navegador la descarta, el proxy sabe que toca
 * refrescar sin necesidad de decodificar el JWT. */
export const ACCESS_TOKEN_COOKIE = "access_token";

/** Refresh token opaco (30 días, rotado por la API en cada uso). */
export const REFRESH_TOKEN_COOKIE = "refresh_token";

/** Vida del refresh token en segundos — espejo de los 30 días de la API. */
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

/** Cookies efímeras del flujo OAuth con Entra (PKCE), 10 min de vida. */
export const ENTRA_VERIFIER_COOKIE = "entra_code_verifier";
export const ENTRA_STATE_COOKIE = "entra_oauth_state";

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

export function sessionCookieOptions(maxAgeSeconds: number): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** Segundos de vida restante del access token (viene de la API). */
  expiresIn: number;
}

/**
 * POST /auth/refresh contra la API. Devuelve los tokens nuevos o `null` si el
 * refresh token ya no sirve (expirado, revocado o reuso detectado — la API
 * revoca la familia entera). Compartido entre apiFetch() y el proxy.
 */
export async function refreshSessionTokens(
  apiUrl: string,
  refreshToken: string,
): Promise<SessionTokens | null> {
  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as SessionTokens;
    return {
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresIn: body.expiresIn,
    };
  } catch {
    // API caída: tratar como "sin sesión" en vez de romper la navegación.
    return null;
  }
}
