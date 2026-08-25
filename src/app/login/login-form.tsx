"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, Lock, Mail } from "lucide-react";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { login, signInWithAzure, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const initialState: LoginState = { error: initialError };
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="space-y-5">
      <form action={signInWithAzure}>
        <AzureButton />
      </form>
      <p className="text-center text-[11px] text-muted-foreground">
        SSO corporativo con su cuenta de Intelecto / xRM
      </p>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <ItcInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state?.email}
            icon={<Mail className="h-4 w-4" />}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <ItcInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            icon={<Lock className="h-4 w-4" />}
          />
        </div>

        {state?.error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}

function AzureButton() {
  const { pending } = useFormStatus();
  return (
    <ItcButton type="submit" variant="secondary" className="w-full" disabled={pending}>
      <Building2 className="h-4 w-4" />
      {pending ? "Conectando con Microsoft..." : "Continuar con Microsoft Entra ID"}
    </ItcButton>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <ItcButton type="submit" className="w-full" disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar"}
    </ItcButton>
  );
}
