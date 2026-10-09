"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ItcModal } from "@/components/itc";
import { ItcButton } from "@/components/itc";
import { formatDateTime } from "@/lib/format";
import type { Actividad } from "@/lib/calendar";

export function ActividadDetalleModal({
  actividad,
  onClose,
}: {
  actividad: Actividad | null;
  onClose: () => void;
}) {
  const router = useRouter();

  const SOURCE_LABELS: Record<string, string> = {
    event: "Evento",
    secop_closing: "Cierre SECOP",
  };

  const ESTADO_LABELS: Record<string, string> = {
    pendiente: "Pendiente",
    proxima_a_vencer: "Próxima a vencer",
    vencida: "Vencida",
  };

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: "text-muted-foreground",
    proxima_a_vencer: "text-amber-600 dark:text-amber-400",
    vencida: "text-destructive",
  };

  const FECHA_INICIO_LABELS: Record<string, string> = {
    event: "Inicio",
    secop_closing: "Fecha de cierre",
  };

  return (
    <ItcModal
      open={actividad !== null}
      onClose={onClose}
      title={actividad?.title}
      content={
        actividad && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Tipo</span>
              <span>{SOURCE_LABELS[actividad.source] ?? actividad.source}</span>

              <span className="text-muted-foreground">Estado</span>
              <span className={ESTADO_COLORS[actividad.estado] ?? ""}>
                {ESTADO_LABELS[actividad.estado] ?? actividad.estado}
              </span>

              <span className="text-muted-foreground">
                {FECHA_INICIO_LABELS[actividad.source] ?? "Inicio"}
              </span>
              <span>{formatDateTime(actividad.startDate)}</span>

              {actividad.endDate && (
                <>
                  <span className="text-muted-foreground">Fin</span>
                  <span>{formatDateTime(actividad.endDate)}</span>
                </>
              )}

              {actividad.numeroProceso && (
                <>
                  <span className="text-muted-foreground">N° proceso</span>
                  <span className="font-mono">{actividad.numeroProceso}</span>
                </>
              )}

              {actividad.entidad && (
                <>
                  <span className="text-muted-foreground">Entidad</span>
                  <span>{actividad.entidad}</span>
                </>
              )}

              <span className="text-muted-foreground">Responsable</span>
              <span>{actividad.responsableNombre ?? "Sin asignar"}</span>

              {actividad.prioridad && (
                <>
                  <span className="text-muted-foreground">Prioridad</span>
                  <span className="capitalize">{actividad.prioridad}</span>
                </>
              )}

              {actividad.eventType && (
                <>
                  <span className="text-muted-foreground">Tipo de evento</span>
                  <span className="capitalize">{actividad.eventType}</span>
                </>
              )}
            </div>

            {actividad.processId && (
              <div className="pt-2">
                <ItcButton
                  variant="secondary"
                  onClick={() => router.push(`/seguimiento/${actividad.processId}`)}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Ver proceso completo
                </ItcButton>
              </div>
            )}
          </div>
        )
      }
    />
  );
}
