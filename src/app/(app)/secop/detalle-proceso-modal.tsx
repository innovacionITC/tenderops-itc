"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { ItcModal } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatCOP, formatDate, formatDateTime } from "@/lib/format";
import { datasetLabels } from "@/lib/secop-shared";

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
};

function Campo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{value ?? "—"}</dd>
    </div>
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
      variant="info"
      size="lg"
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

            <Campo label="Objeto" value={proceso.objeto} />

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
