"use client";

import type { ReactNode } from "react";
import { ItcModal } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import type { AuditoriaRow } from "@/lib/auditoria-shared";

function Campo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{value ?? "—"}</dd>
    </div>
  );
}

export function DetalleAuditoriaModal({
  evento,
  onClose,
}: {
  evento: AuditoriaRow | null;
  onClose: () => void;
}) {
  return (
    <ItcModal
      open={evento !== null}
      onClose={onClose}
      size="lg"
      maxHeight="90vh"
      className="detalle-auditoria-modal"
      title={evento?.description ?? "Detalle del evento"}
      content={
        evento && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge tone={evento.result === "ok" ? "success" : "danger"}>
                {evento.result === "ok" ? "Exitoso" : "Error"}
              </StatusBadge>
              <StatusBadge tone="info">{evento.operationType}</StatusBadge>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Fecha/hora" value={formatDate(evento.createdAt)} />
              <Campo label="Usuario" value={evento.userName} />
              <Campo label="Rol" value={evento.role} />
              <Campo label="IP" value={evento.ipAddress} />
              <Campo label="Módulo" value={evento.module} />
              <Campo label="Funcionalidad" value={evento.description} />
              <Campo label="Tipo de operación" value={evento.operationType} />
              <Campo label="ID registro afectado" value={evento.entityId} />
              <Campo label="Resultado" value={
                <StatusBadge tone={evento.result === "ok" ? "success" : "danger"}>
                  {evento.result ?? "—"}
                </StatusBadge>
              } />
            </dl>

            {evento.observations && (
              <Campo label="Observaciones" value={evento.observations} />
            )}

            {evento.metadata && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Metadata</dt>
                <dd className="mt-0.5">
                  <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(evento.metadata), null, 2);
                      } catch {
                        return evento.metadata;
                      }
                    })()}
                  </pre>
                </dd>
              </div>
            )}
          </div>
        )
      }
      showCloseButton
    />
  );
}
