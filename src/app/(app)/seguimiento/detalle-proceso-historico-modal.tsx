"use client";

import type { ReactNode } from "react";
import { ItcModal } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatCOP, formatDate } from "@/lib/format";
import type { ProcesoHistoricoRow } from "@/lib/seguimiento-historicos-shared";

function Campo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{value ?? "—"}</dd>
    </div>
  );
}

export function DetalleProcesoHistoricoModal({
  proceso,
  onClose,
}: {
  proceso: ProcesoHistoricoRow | null;
  onClose: () => void;
}) {
  return (
    <ItcModal
      open={proceso !== null}
      onClose={onClose}
      size="lg"
      maxHeight="90vh"
      className="detalle-proceso-historico-modal"
      title={proceso?.secopId ?? "Detalle del proceso"}
      content={
        proceso && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge
                tone={
                  proceso.estadoFinal === "Perdido"
                    ? "danger"
                    : proceso.estadoFinal === "Descartado"
                      ? "muted"
                      : "info"
                }
              >
                {proceso.estadoFinal}
              </StatusBadge>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Número del proceso" value={proceso.secopId} />
              <Campo label="Entidad" value={proceso.entidad} />
              <Campo label="Responsable" value={proceso.responsableNombre} />
              <Campo label="Valor estimado" value={formatCOP(proceso.valor)} />
              <Campo label="Fecha de cierre" value={formatDate(proceso.fechaCierre)} />
              <Campo label="Última actualización" value={formatDate(proceso.fechaUltimaActualizacion)} />
            </dl>

            <Campo label="Objeto" value={proceso.objeto} />
            <Campo label="Motivo de cierre" value={proceso.motivoCierre} />
          </div>
        )
      }
      showCloseButton
    />
  );
}
