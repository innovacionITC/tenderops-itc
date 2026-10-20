"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Video } from "lucide-react";
import { ItcButton, ItcModal } from "@/components/itc";
import { formatDate, formatDateTime } from "@/lib/format";
import type { EventoCalendario } from "@/lib/calendar";

const ORIGEN_LABELS: Record<string, string> = {
  dynamics: "Cita Dynamics",
  outlook: "Evento Outlook",
  cierre_secop: "Cierre SECOP",
};

export function EventoDetalleModal({
  evento,
  onClose,
}: {
  evento: EventoCalendario | null;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <ItcModal
      open={evento !== null}
      onClose={onClose}
      title={evento?.titulo}
      content={
        evento && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Origen</span>
              <span>{ORIGEN_LABELS[evento.origen] ?? evento.origen}</span>

              {evento.cancelado && (
                <>
                  <span className="text-muted-foreground">Estado</span>
                  <span className="text-destructive">Cancelado</span>
                </>
              )}

              <span className="text-muted-foreground">
                {evento.todoElDia ? "Día" : "Inicio"}
              </span>
              <span>{evento.todoElDia ? formatDate(evento.inicio) : formatDateTime(evento.inicio)}</span>

              {!evento.todoElDia && (
                <>
                  <span className="text-muted-foreground">Fin</span>
                  <span>{formatDateTime(evento.fin)}</span>
                </>
              )}

              {evento.ubicacion && (
                <>
                  <span className="text-muted-foreground">Ubicación</span>
                  <span>{evento.ubicacion}</span>
                </>
              )}

              {evento.organizador && (
                <>
                  <span className="text-muted-foreground">Organizador</span>
                  <span>{evento.organizador}</span>
                </>
              )}

              {evento.asistentes.length > 0 && (
                <>
                  <span className="text-muted-foreground">Asistentes</span>
                  <span>{evento.asistentes.join(", ")}</span>
                </>
              )}

              {evento.oportunidadNombre && (
                <>
                  <span className="text-muted-foreground">Oportunidad</span>
                  <span>{evento.oportunidadNombre}</span>
                </>
              )}

              {evento.numeroProceso && (
                <>
                  <span className="text-muted-foreground">N° proceso</span>
                  <span className="font-mono">{evento.numeroProceso}</span>
                </>
              )}

              {evento.entidad && (
                <>
                  <span className="text-muted-foreground">Entidad</span>
                  <span>{evento.entidad}</span>
                </>
              )}
            </div>

            {evento.esRecurrente && (
              <p className="text-xs text-muted-foreground">
                Este evento es parte de una serie; ábrelo en Outlook para editar la ocurrencia o la serie.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {evento.urlReunion && (
                <ItcButton
                  variant="secondary"
                  href={evento.urlReunion}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="mr-1.5 h-3.5 w-3.5" />
                  Unirse a la reunión
                </ItcButton>
              )}

              {evento.webLink && (evento.origen === "outlook" || evento.origen === "dynamics") && (
                <ItcButton
                  variant="secondary"
                  href={evento.webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Abrir en Outlook
                </ItcButton>
              )}

              {evento.procesoId && (
                <ItcButton
                  variant="secondary"
                  onClick={() => router.push(`/seguimiento/${evento.procesoId}`)}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Ver proceso completo
                </ItcButton>
              )}
            </div>
          </div>
        )
      }
    />
  );
}
