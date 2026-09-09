"use client";

import { RefreshCw } from "lucide-react";
import { ItcButton } from "@/components/itc";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-destructive">
          <h2 className="text-lg font-semibold">Error del servidor</h2>
          <p className="text-sm">Ocurrió un error inesperado. Intenta de nuevo.</p>
          <ItcButton variant="secondary" onClick={() => unstable_retry()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </ItcButton>
        </div>
      </body>
    </html>
  );
}
