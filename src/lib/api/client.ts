import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { serverEnv } from "@/env.server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  refreshSessionTokens,
  sessionCookieOptions,
  type SessionTokens,
} from "./cookies";

// Cliente BFF → API .NET (Fase 7 del plan). Server Components y Server
// Actions llaman a estas funciones; el navegador nunca ve los tokens.

/** Shape del ProblemDetails que emite la API (handlers de ExceptionHandling). */
interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  extensions?: {
    errors?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly detail: string | null;
  readonly traceId: string | null;
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, problem: ProblemDetails | null) {
    const errors = problem?.extensions?.errors;
    const firstError = errors
      ? Object.values(errors).flat().join(" ")
      : null;
    super(firstError ?? problem?.detail ?? problem?.title ?? `API respondió ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = problem?.code ?? null;
    this.detail = problem?.detail ?? null;
    this.traceId = problem?.traceId ?? null;
    this.fieldErrors = errors ?? {};
  }
}

// Un RSC no puede escribir cookies (solo Server Actions y Route Handlers).
// Si el access token vence a mitad de un render, el refresh sí ocurre pero la
// cookie nueva no se puede persistir: este holder por request (React cache)
// conserva los tokens rotados para el resto del render, y el proxy volverá a
// refrescar en la siguiente navegación.
const requestTokenOverride = cache(() => ({ tokens: null as SessionTokens | null }));

// Dedupe de refrescos concurrentes en el mismo proceso: la API rota el refresh
// token en cada uso y revoca la familia entera si detecta reuso, así que dos
// llamadas paralelas con el mismo token NO pueden llegar ambas a /auth/refresh.
const refreshInFlight = new Map<string, Promise<SessionTokens | null>>();

function dedupedRefresh(refreshToken: string): Promise<SessionTokens | null> {
  const existing = refreshInFlight.get(refreshToken);
  if (existing) return existing;

  const promise = refreshSessionTokens(serverEnv.TENDEROPS_API_URL, refreshToken).finally(() => {
    refreshInFlight.delete(refreshToken);
  });
  refreshInFlight.set(refreshToken, promise);
  return promise;
}

/** Escribe las cookies de sesión. Solo funciona en Server Actions y Route
 * Handlers; en un RSC lanza y el llamador debe conformarse con el override. */
export async function persistSessionTokens(tokens: SessionTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, sessionCookieOptions(tokens.expiresIn));
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    sessionCookieOptions(REFRESH_TOKEN_MAX_AGE),
  );
}

/** Normaliza el TokensResponse de la API al shape de las cookies de sesión. */
export function toSessionTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number | string;
}): SessionTokens {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: Number(tokens.expiresIn),
  };
}

export async function clearSessionTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

async function currentTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const override = requestTokenOverride().tokens;
  if (override) {
    return { accessToken: override.accessToken, refreshToken: override.refreshToken };
  }
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
}

async function adoptTokens(tokens: SessionTokens): Promise<void> {
  requestTokenOverride().tokens = tokens;
  try {
    await persistSessionTokens(tokens);
  } catch {
    // Render de un RSC: no se pueden escribir cookies aquí. El override por
    // request cubre el resto del render; el proxy refresca en la siguiente
    // navegación (la cookie del access vencido ya expiró por Max-Age).
  }
}

async function parseProblem(res: Response): Promise<ProblemDetails | null> {
  try {
    return (await res.json()) as ProblemDetails;
  } catch {
    return null;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}


async function fetchWithAuth(path: string, options: ApiFetchOptions): Promise<Response> {
  const { method = "GET", body, query } = options;

  const url = new URL(`${serverEnv.TENDEROPS_API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const isFormData = body instanceof FormData;

  const doFetch = (accessToken: string | null) =>
    fetch(url, {
      method,
      headers: {
        ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
      cache: "no-store",
    });

  const { accessToken, refreshToken } = await currentTokens();
  let res = await doFetch(accessToken);

  if (res.status === 401 && refreshToken) {
    const refreshed = await dedupedRefresh(refreshToken);
    if (refreshed) {
      await adoptTokens(refreshed);
      res = await doFetch(refreshed.accessToken);
    }
  }

  return res;
}

/**
 * Como `fetchWithAuth`, pero lanza `ApiError` en cualquier respuesta no-2xx
 * (con el `detail` en español de la API como `message`) y parsea el body
 * como JSON.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET" } = options;
  const res = await fetchWithAuth(path, options);

  if (!res.ok) {
    const error = new ApiError(res.status, await parseProblem(res));
    // Solo 5xx: los 4xx son errores de negocio esperados (validación, 404,
    // 409...) que ya se muestran en español al usuario — no vale la pena
    // buscarlos en los logs de la API. Un 5xx sí lo vale, y el traceId es el
    // hilo que conecta este log con el de la API (Fase 8 del plan .NET).
    if (res.status >= 500) {
      console.error(`[api] ${method} ${path} -> ${res.status} (traceId=${error.traceId ?? "?"})`);
    }
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Como `apiFetch` pero devuelve la `Response` cruda (body sin parsear, sin
 * comprobar `ok`) — para proxies de streaming binario como la descarga de
 * archivos de plantillas, donde el llamador reenvía el body/headers tal
 * cual. Comparte el mismo Bearer + refresh deduplicado que `apiFetch`.
 */
export async function apiFetchRaw(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  return fetchWithAuth(path, options);
}
