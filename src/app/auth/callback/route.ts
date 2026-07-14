import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Completes the Azure/Entra OAuth (PKCE) flow: Supabase redirects the user
// back here with a `code` after they authenticate with Microsoft.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No se pudo completar el inicio de sesión con Microsoft.")}`,
  );
}
