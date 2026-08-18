"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { ExternalLink, MoreHorizontal, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ItcTable, type TableColumn, ItcModal } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCOP, formatDate } from "@/lib/format";
import { RESULTADO_OPCIONES, type ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";
import { marcarProceso } from "./actions";

// Las 3 opciones accionables desde "Marcar" salen de RESULTADO_OPCIONES (única
// fuente de verdad); "adjudicado" y "cerrado" son resultados que el backend
// puede devolver pero que no se eligen manualmente desde este menú.
const RESULTADO_LABELS: Record<string, string> = {
  ...Object.fromEntries(RESULTADO_OPCIONES.map((o) => [o.value, o.label])),
  adjudicado: "Adjudicado",
  cerrado: "Cerrado",
};

export function SeguimientoView({
  procesos,
}: {
  procesos: ProcesoSeguimientoRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [marcarTarget, setMarcarTarget] = useState<{
    proceso: ProcesoSeguimientoRow;
    resultado: string;
    label: string;
  } | null>(null);

  const handleMarcar = () => {
    if (!marcarTarget) return;
    const { resultado } = marcarTarget;
    startTransition(async () => {
      try {
        await marcarProceso(marcarTarget.proceso.id, resultado);
        toast.success(`Proceso marcado como "${marcarTarget.label}"`);
        setMarcarTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo marcar el proceso");
      }
    });
  };

  const columns: TableColumn<ProcesoSeguimientoRow>[] = [
    {
      key: "titulo",
      title: "Proceso",
      width: "25%",
      render: (r) => (
        <span className="block truncate font-medium" title={r.titulo ?? r.secopId ?? undefined}>
          {r.titulo ?? r.secopId}
        </span>
      ),
    },
    {
      key: "entidad",
      title: "Entidad",
      width: "18%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.entidad ?? undefined}>
          {r.entidad ?? "—"}
        </span>
      ),
    },
    {
      key: "valor",
      title: "Valor",
      width: "10%",
      align: "right",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>
      ),
    },
    {
      key: "fechaPresentacionOferta",
      title: "Presentación",
      width: "10%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.fechaPresentacionOferta ?? undefined}>
          {formatDate(r.fechaPresentacionOferta)}
        </span>
      ),
    },
    {
      key: "estado",
      title: "Estado",
      width: "11%",
      render: (r) => (
        <StatusBadge tone={r.estado === "en_seguimiento" ? "info" : "muted"}>
          {r.estado === "en_seguimiento" ? "En seguimiento" : "Cerrado"}
        </StatusBadge>
      ),
    },
    {
      key: "resultado",
      title: "Resultado",
      width: "11%",
      render: (r) => {
        if (!r.resultado) return <span className="text-muted-foreground">—</span>;
        const tone =
          r.resultado === "presentado" || r.resultado === "adjudicado"
            ? "success"
            : r.resultado === "no_adjudicado"
              ? "danger"
              : "muted";
        return <StatusBadge tone={tone}>{RESULTADO_LABELS[r.resultado] ?? r.resultado}</StatusBadge>;
      },
    },
    {
      key: "acciones",
      title: "",
      width: 120,
      align: "right",
      render: (r) => (
        <div className="flex items-center gap-1">
          <RowActionButton
            icon={<ChevronRight className="h-3.5 w-3.5" />}
            title="Abrir"
            onClick={() => router.push(`/seguimiento/${r.id}`)}
          />
          {r.url && (
            <RowActionButton
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              title="Abrir en SECOP"
              href={r.url}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {RESULTADO_OPCIONES.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() =>
                    setMarcarTarget({ proceso: r, resultado: opt.value, label: opt.label })
                  }
                >
                  Marcar como {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (procesos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No hay procesos en seguimiento. Promueve procesos desde Consulta SECOP.
      </div>
    );
  }

  return (
    <>
      <ItcTable
        data={procesos}
        columns={columns}
        rowKey={(r) => r.id}
        pagination={false}
        tableLayout="fixed"
        responsiveStrategy="cards"
        striped
        hoverable
        stickyHeader
        ariaLabel="Tabla de procesos en seguimiento"
      />
      <ItcModal
        open={marcarTarget !== null}
        onClose={() => setMarcarTarget(null)}
        onConfirm={handleMarcar}
        title="¿Marcar proceso?"
        content={
          <p className="text-sm text-muted-foreground">
            El proceso{" "}
            <span className="font-medium">
              {marcarTarget?.proceso.titulo ?? marcarTarget?.proceso.secopId}
            </span>{" "}
            se marcará como{" "}
            <span className="font-medium">{marcarTarget?.label}</span>.
          </p>
        }
        variant="confirm"
        confirmText="Marcar"
        disabled={isPending}
      />
    </>
  );
}
