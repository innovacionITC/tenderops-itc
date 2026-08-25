"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ItcModal } from "@/components/itc";
import { ItcButton } from "@/components/itc";
import type { Actividad } from "@/lib/calendar";

export function ActividadDetalleModal({
  actividad,
  onClose,
}: {
  actividad: Actividad;
  onClose: () => void;
}) {
  const router = useRouter();

  const SOURCE_LABELS: Record<string, string> = {
    event: "Evento",
    task: "Tarea",
    secop_closing: "Cierre SECOP",
  };

  const ESTADO_LABELS: Record<string, string> = {
    pendiente: "Pendiente",
    proxima_a_vencer: "Próxima a vencer",
    vencida: "Vencida",
    completada: "Completada",
  };

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: "text-muted-foreground",
    proxima_a_vencer: "text-amber-600 dark:text-amber-400",
    vencida: "text-destructive",
    completada: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <ItcModal
      open={true}
      onClose={onClose}
      title={actividad.title}
      content={
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <span className="text-muted-foreground">Tipo</span>
            <span>{SOURCE_LABELS[actividad.source] ?? actividad.source}</span>

            <span className="text-muted-foreground">Estado</span>
            <span className={ESTADO_COLORS[actividad.estado] ?? ""}>
              {ESTADO_LABELS[actividad.estado] ?? actividad.estado}
            </span>

            <span className="text-muted-foreground">Inicio</span>
            <span>{new Date(actividad.startDate).toLocaleDateString("es-CO")}</span>

            {actividad.endDate && (
              <>
                <span className="text-muted-foreground">Fin</span>
                <span>{new Date(actividad.endDate).toLocaleDateString("es-CO")}</span>
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

            {actividad.responsableNombre && (
              <>
                <span className="text-muted-foreground">Responsable</span>
                <span>{actividad.responsableNombre}</span>
              </>
            )}

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
      }
    />
  );
}
