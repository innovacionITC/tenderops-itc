"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email({ error: "Correo inválido." }),
  password: z.string().min(1, { error: "La contraseña es obligatoria." }),
});

export interface LoginState {
  error?: string;
  email?: string;
}

// Supabase's AuthError.message is always English; map the stable `code`
// (see https://supabase.com/docs/guides/auth/debugging/error-codes) to
// Spanish copy instead of surfacing it as-is.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Debes confirmar tu correo antes de iniciar sesión.",
  user_banned: "Tu cuenta está bloqueada. Contacta al administrador.",
  over_request_rate_limit: "Demasiados intentos. Intenta de nuevo en unos minutos.",
  over_email_send_rate_limit: "Demasiados intentos. Intenta de nuevo en unos minutos.",
};

function translateAuthError(code: string | undefined): string {
  return (code && AUTH_ERROR_MESSAGES[code]) ?? "No se pudo iniciar sesión. Intenta de nuevo.";
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: translateAuthError(error.code), email };
  }

  redirect("/dashboard");
}

export async function signInWithAzure() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: "email openid profile",
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "No se pudo iniciar sesión con Microsoft.")}`,
    );
  }

  redirect(data.url);
}
