"use client";

import { ExternalLink } from "lucide-react";
import { ItcTable, type TableColumn } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { formatCOP, formatDate } from "@/lib/format";
import {
  datasetLabels,
  type Paginado,
  type ProcesoRow,
} from "@/lib/secop-shared";

export function SeguimientoView({
  procesos,
}: {
  procesos: Paginado<ProcesoRow>;
}) {
  const columns: TableColumn<ProcesoRow>[] = [
    {
      key: "titulo",
      title: "Proceso",
      render: (r) => (
        <div className="min-w-0 max-w-md">
          <span className="truncate font-medium">
            {r.titulo ?? r.secopId}
          </span>
        </div>
      ),
    },
    {
      key: "entidad",
      title: "Entidad",
      render: (r) => (
        <span className="truncate text-sm text-muted-foreground">
          {r.entidad ?? "—"}
        </span>
      ),
    },
    {
      key: "dataset",
      title: "Fuente",
      render: (r) => (
        <StatusBadge tone="muted">
          {datasetLabels[r.dataset] ?? r.dataset}
        </StatusBadge>
      ),
    },
    {
      key: "valor",
      title: "Valor",
      align: "right",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>
      ),
    },
    {
      key: "detectadoEl",
      title: "Detectado",
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(r.detectadoEl)}
        </span>
      ),
    },
    {
      key: "acciones",
      title: "",
      align: "right",
      render: (r) =>
        r.url ? (
          <RowActionButton
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            title="Abrir en SECOP"
            href={r.url}
          />
        ) : null,
    },
  ];

  if (procesos.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No hay procesos en seguimiento. Promueve procesos desde Consulta SECOP.
      </div>
    );
  }

  return (
    <ItcTable
      data={procesos.items}
      columns={columns}
      rowKey={(r) => r.id}
      pagination={false}
      striped
      hoverable
      stickyHeader
    />
  );
}
