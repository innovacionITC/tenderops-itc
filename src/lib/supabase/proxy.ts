import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

// Refreshes the Supabase session cookie on every navigation. Called from
// src/proxy.ts (Next.js 16's renamed `middleware.ts`). Only performs the
// optimistic "do we have a user" check — real authorization happens in
// requireAuth() close to the data (see src/lib/auth/session.ts), since Proxy
// coverage can silently drop on refactors (matcher changes, moved routes).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not add logic between createServerClient and getUser() — it refreshes
  // the auth token and must run before anything else touches the response.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
