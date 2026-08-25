"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { ItcButton } from "@/components/itc";
import { Spinner } from "@/components/ui/spinner";
import type { AuditoriaErrorTipo } from "@/lib/errors/auditoria";
import { AUDITORIA_ERROR_MENSAJES } from "@/lib/errors/auditoria";

export function AuditoriaErrorBanner({ tipo }: { tipo: AuditoriaErrorTipo }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      <span>{AUDITORIA_ERROR_MENSAJES[tipo]}</span>
      <ItcButton
        variant="secondary"
        disabled={isPending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {isPending ? <Spinner className="size-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Reintentar
      </ItcButton>
    </div>
  );
}
