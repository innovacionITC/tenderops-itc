import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  refreshSessionTokens,
  sessionCookieOptions,
} from "@/lib/api/cookies";

const PUBLIC_ROUTES = ["/login", "/auth"];

// Chequeo optimista de sesión + refresh del access token (Fase 7: tokens
// propios de la API, ya no updateSession() de Supabase). La cookie del access
// token tiene Max-Age = expiresIn (15 min): si el navegador ya no la manda, el
// token venció y toca refrescar con la de 30 días. La autorización real sigue
// en requireAuth() + las policies de la API, no aquí.
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let hasSession = Boolean(accessToken);
  let response = NextResponse.next({ request });

  if (!accessToken && refreshToken) {
    const apiUrl = process.env.TENDEROPS_API_URL;
    const tokens = apiUrl ? await refreshSessionTokens(apiUrl, refreshToken) : null;

    if (tokens) {
      // Al request (para que este render ya vea el token nuevo) y al response
      // (para que el navegador lo persista) — mismo patrón que usaba el
      // updateSession() de Supabase.
      request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);
      request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
      response = NextResponse.next({ request });
      response.cookies.set(
        ACCESS_TOKEN_COOKIE,
        tokens.accessToken,
        sessionCookieOptions(tokens.expiresIn),
      );
      response.cookies.set(
        REFRESH_TOKEN_COOKIE,
        tokens.refreshToken,
        sessionCookieOptions(REFRESH_TOKEN_MAX_AGE),
      );
      hasSession = true;
    } else {
      // Refresh muerto (expirado o familia revocada): sesión terminada.
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      hasSession = false;
    }
  }

  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
