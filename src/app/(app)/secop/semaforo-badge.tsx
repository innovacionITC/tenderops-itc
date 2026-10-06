"use client";

import { CircleAlert } from "lucide-react";
import { semaforoLabels, SEMAFOROS } from "@/lib/secop-shared";
import { cn } from "@/lib/utils";

type Color = (typeof SEMAFOROS)[number];

export const semaforoEstilos: Record<Color, { pill: string; dot: string; bar: string }> = {
  verde: {
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  amarillo: {
    pill: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  rojo: {
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    bar: "bg-destructive",
  },
};

const PILL_BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium";
const PILL_MUTED = "border-border bg-muted/60 text-muted-foreground";

export function esColorSemaforo(valor: string | null | undefined): valor is Color {
  return SEMAFOROS.includes(valor as Color);
}

/**
 * Insignia compacta del semáforo. Solo estado, color y score: la justificación
 * y el motivo de un error viven en el detalle del proceso, no en la tabla.
 */
export function SemaforoBadge({
  semaforo,
  semaforoScore,
  semaforoEstado,
}: {
  semaforo: string | null;
  semaforoScore: number | null;
  semaforoEstado: string | null;
}) {
  if (semaforoEstado === null) {
    return (
      <span
        className="text-xs text-muted-foreground/50"
        title="Se detectó antes de activar el agente semáforo"
      >
        —
      </span>
    );
  }

  if (semaforoEstado === "error") {
    return (
      <span className={cn(PILL_BASE, PILL_MUTED)} title="No se pudo clasificar. Ver detalle.">
        <CircleAlert className="h-3 w-3" aria-hidden />
        Error
      </span>
    );
  }

  if (semaforoEstado === "pendiente" || semaforoEstado === "procesando") {
    return (
      <span className={cn(PILL_BASE, PILL_MUTED)}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60" aria-hidden />
        Pendiente
      </span>
    );
  }

  if (semaforoEstado === "clasificado" && esColorSemaforo(semaforo)) {
    const estilo = semaforoEstilos[semaforo];

    return (
      <span className={cn(PILL_BASE, estilo.pill)}>
        <span className={cn("h-2 w-2 rounded-full", estilo.dot)} aria-hidden />
        {semaforoLabels[semaforo] ?? semaforo}
        {semaforoScore != null && (
          <span className="tabular-nums opacity-70">{semaforoScore}</span>
        )}
      </span>
    );
  }

  if (semaforoEstado === "clasificado") {
    return <span className={cn(PILL_BASE, PILL_MUTED)}>Sin dato</span>;
  }

  return null;
}
