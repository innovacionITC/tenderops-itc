"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ItcTable, type TableColumn, ItcModal, ItcInput } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCOP, formatDate } from "@/lib/format";
import { RESULTADO_OPCIONES, opcionesMarcarDisponibles, type ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";
import { marcarProceso } from "./actions";

const RESULTADO_LABELS: Record<string, string> = {
  ...Object.fromEntries(RESULTADO_OPCIONES.map((o) => [o.value, o.label])),
  cerrado: "Cerrado",
};

const ESTADO_LABEL: Record<ProcesoSeguimientoRow["estado"], string> = {
  en_seguimiento: "En seguimiento",
  presentado: "Presentado",
  cerrado: "Cerrado",
};

const ESTADO_TONE: Record<ProcesoSeguimientoRow["estado"], "info" | "success" | "muted"> = {
  en_seguimiento: "info",
  presentado: "success",
  cerrado: "muted",
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
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [valorAdjudicado, setValorAdjudicado] = useState("");
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState("");

  const cerrarMarcarModal = () => {
    setMarcarTarget(null);
    setMotivoDescarte("");
    setValorAdjudicado("");
    setFechaAdjudicacion("");
  };

  const handleMarcar = () => {
    if (!marcarTarget) return;
    const { resultado } = marcarTarget;

    if (resultado === "descartado" && !motivoDescarte.trim()) {
      toast.error("Debes indicar un motivo para descartar el proceso");
      return;
    }

    if (resultado === "adjudicado") {
      if (!valorAdjudicado.trim()) {
        toast.error("Debes indicar el valor adjudicado");
        return;
      }
      if (!fechaAdjudicacion) {
        toast.error("Debes indicar la fecha de adjudicación");
        return;
      }
    }

    startTransition(async () => {
      try {
        await marcarProceso(
          marcarTarget.proceso.id,
          resultado,
          resultado === "descartado" ? motivoDescarte.trim() : undefined,
          resultado === "adjudicado" ? Number(valorAdjudicado) : undefined,
          resultado === "adjudicado" ? fechaAdjudicacion : undefined,
        );
        toast.success(`Proceso marcado como "${marcarTarget.label}"`);
        cerrarMarcarModal();
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
      align: "center",
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
      align: "center",
      render: (r) => (
        <StatusBadge tone={ESTADO_TONE[r.estado]}>{ESTADO_LABEL[r.estado]}</StatusBadge>
      ),
    },
    {
      key: "resultado",
      title: "Resultado",
      width: "11%",
      align: "center",
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
      title: "Acciones",
      width: 120,
      align: "center",
      render: (r) => {
        const opciones = opcionesMarcarDisponibles(r.estado, r.resultado);
        return (
          <div className="flex items-center justify-center gap-1">
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
            {opciones.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-input bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Marcar
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {opciones.map((opt) => (
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
            )}
          </div>
        );
      },
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
        onClose={cerrarMarcarModal}
        onConfirm={handleMarcar}
        title="¿Marcar proceso?"
        content={
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              El proceso{" "}
              <span className="font-medium">
                {marcarTarget?.proceso.titulo ?? marcarTarget?.proceso.secopId}
              </span>{" "}
              se marcará como{" "}
              <span className="font-medium">{marcarTarget?.label}</span>.
            </p>
            {marcarTarget?.resultado === "descartado" && (
              <div>
                <Label className="mb-1.5">Motivo del descarte</Label>
                <ItcInput
                  value={motivoDescarte}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setMotivoDescarte(e.target.value)
                  }
                  placeholder="Razón por la que se descarta el proceso…"
                />
              </div>
            )}
            {marcarTarget?.resultado === "adjudicado" && (
              <>
                <div>
                  <Label className="mb-1.5">Valor adjudicado</Label>
                  <ItcInput
                    type="number"
                    value={valorAdjudicado}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                      setValorAdjudicado(e.target.value)
                    }
                    placeholder="Ej: 500000000"
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Fecha de adjudicación</Label>
                  <ItcInput
                    type="date"
                    value={fechaAdjudicacion}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                      setFechaAdjudicacion(e.target.value)
                    }
                  />
                </div>
              </>
            )}
          </div>
        }
        variant="confirm"
        confirmText="Marcar"
        disabled={isPending}
      />
    </>
  );
}
