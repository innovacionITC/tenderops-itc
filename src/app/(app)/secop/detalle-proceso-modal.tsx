"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { ItcModal } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatCOP, formatDate, formatDateTime } from "@/lib/format";
import { datasetLabels } from "@/lib/secop-shared";
import { esColorSemaforo, SemaforoBadge, semaforoEstilos } from "./semaforo-badge";

export type DetalleProceso = {
  titulo: string | null;
  secopId: string;
  dataset?: string;
  entidad: string | null;
  objeto: string | null;
  modalidad: string | null;
  estado: string | null;
  fase: string | null;
  valor: number | null;
  fechaPublicacion: string | null;
  fechaCierre: string | null;
  detectadoEl?: string;
  url: string | null;
  esNuevo?: boolean;
  promovido?: boolean;
  descartado?: boolean;
  semaforo?: string | null;
  semaforoScore?: number | null;
  semaforoJustificacion?: string | null;
  semaforoEstado?: string | null;
  semaforoError?: string | null;
};

function Campo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{value ?? "—"}</dd>
    </div>
  );
}

function SeccionSemaforo({ proceso }: { proceso: DetalleProceso }) {
  const estado = proceso.semaforoEstado;
  const clasificado = estado === "clasificado" && esColorSemaforo(proceso.semaforo ?? null);
  const color = clasificado ? semaforoEstilos[proceso.semaforo as keyof typeof semaforoEstilos] : null;
  const score = proceso.semaforoScore ?? null;

  return (
    <section
      aria-label="Clasificación del semáforo"
      className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Clasificación del semáforo</h3>
        <SemaforoBadge
          semaforo={proceso.semaforo ?? null}
          semaforoScore={null}
          semaforoEstado={estado ?? null}
        />
      </div>

      {clasificado && color && score != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Coincidencia con el perfil de la empresa</span>
            <span className="font-medium tabular-nums text-foreground">{score}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${score}%` }} />
          </div>
        </div>
      )}

      {clasificado && proceso.semaforoJustificacion && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Justificación del agente</p>
          <p className="mt-0.5 text-sm leading-relaxed break-words">{proceso.semaforoJustificacion}</p>
        </div>
      )}

      {(estado === "pendiente" || estado === "procesando") && (
        <p className="text-sm text-muted-foreground">
          El agente aún no ha clasificado este proceso. El resultado aparece aquí cuando termine.
        </p>
      )}

      {estado === "error" && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">No se pudo clasificar</p>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">
            {proceso.semaforoError ?? "El agente no devolvió una clasificación válida."}
          </p>
        </div>
      )}
    </section>
  );
}

export function DetalleProcesoModal({
  proceso,
  onClose,
}: {
  proceso: DetalleProceso | null;
  onClose: () => void;
}) {
  return (
    <ItcModal
      open={proceso !== null}
      onClose={onClose}
      size="lg"
      maxHeight="90vh"
      className="detalle-proceso-modal"
      title={proceso?.titulo ?? proceso?.secopId ?? "Detalle del proceso"}
      content={
        proceso && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {proceso.dataset && (
                <StatusBadge tone="muted">
                  {datasetLabels[proceso.dataset] ?? proceso.dataset}
                </StatusBadge>
              )}
              {proceso.esNuevo && <StatusBadge tone="info">Nuevo</StatusBadge>}
              {proceso.promovido && <StatusBadge tone="success">En seguimiento</StatusBadge>}
              {proceso.descartado && <StatusBadge tone="danger">Descartado</StatusBadge>}
            </div>

            {proceso.semaforoEstado != null && (
              <SeccionSemaforo proceso={proceso} />
            )}

            <dl>
              <Campo label="Objeto" value={proceso.objeto} />
            </dl>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Entidad" value={proceso.entidad} />
              <Campo label="Modalidad" value={proceso.modalidad} />
              <Campo label="Estado" value={proceso.estado} />
              <Campo label="Fase" value={proceso.fase} />
              <Campo label="Cuantía" value={formatCOP(proceso.valor)} />
              <Campo label="Fecha de publicación" value={formatDate(proceso.fechaPublicacion)} />
              <Campo label="Fecha de cierre" value={formatDate(proceso.fechaCierre)} />
              {proceso.detectadoEl && (
                <Campo label="Detectado" value={formatDateTime(proceso.detectadoEl)} />
              )}
              <Campo label="Identificador SECOP" value={proceso.secopId} />
            </dl>


            {proceso.url && (
              <a
                href={proceso.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Abrir en SECOP
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )
      }
      showCloseButton
    />
  );
}
