"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, type ChangeEvent } from "react";
import { ExternalLink, ChevronDown, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import {
  ItcTable,
  type TableColumn,
  ItcModal,
  ItcInput,
  ItcButton,
} from "@/components/itc";
import { RowActionButton } from "@/components/layout/row-action-button";
import { FiltrosPanel, type CampoFiltro, type ValoresFiltro } from "@/components/layout/filtros-panel";
import { Label } from "@/components/ui/label";
import {
  MoneyCell,
  ProcessFactsCell,
  ProcessIdentityCell,
} from "@/components/layout/process-cells";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMilesInput, parseMilesInput } from "@/lib/format";
import { datasetLabels } from "@/lib/secop-shared";
import {
  RESULTADO_OPCIONES,
  opcionesMarcarDisponibles,
  type ProcesoSeguimientoRow,
  type SeguimientoFiltrosDisponibles,
} from "@/lib/seguimiento-shared";
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

const ESTADO_FILTRO_OPCIONES = [
  { value: "en_seguimiento", label: "En seguimiento" },
  { value: "presentado", label: "Presentado" },
] as const;

const RESULTADO_FILTRO_OPCIONES = [
  { value: "presentado", label: "Presentado" },
] as const;

type FiltrosState = {
  buscar: string;
  entidad: string;
  objeto: string;
  modalidad: string;
  fase: string;
  cuantiaMin: string;
  cuantiaMax: string;
  detectadoDesde: string;
  detectadoHasta: string;
  presentacionDesde: string;
  presentacionHasta: string;
  estado: string;
  resultado: string;
};

export function SeguimientoView({
  procesos,
  filtros,
  filtrosDisponibles,
}: {
  procesos: ProcesoSeguimientoRow[];
  filtros: FiltrosState;
  filtrosDisponibles: SeguimientoFiltrosDisponibles;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isBuscando, startBuscar] = useTransition();
  const [buscar, setBuscar] = useState(filtros.buscar);
  const [marcarTarget, setMarcarTarget] = useState<{
    proceso: ProcesoSeguimientoRow;
    resultado: string;
    label: string;
  } | null>(null);
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [valorAdjudicado, setValorAdjudicado] = useState("");
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState("");

  const campos: CampoFiltro[] = [
    {
      tipo: "seleccion-libre",
      clave: "entidad",
      etiqueta: "Entidad",
      seccion: "Contratación",
      opciones: filtrosDisponibles.entidades,
      placeholderTodos: "Todas",
    },
    {
      tipo: "seleccion-libre",
      clave: "modalidad",
      etiqueta: "Modalidad",
      seccion: "Contratación",
      opciones: filtrosDisponibles.modalidades,
      placeholderTodos: "Todas",
    },
    {
      tipo: "select",
      clave: "fase",
      etiqueta: "Fase",
      seccion: "Contratación",
      placeholderTodos: "Todas",
      opciones: filtrosDisponibles.fases.map((f) => ({ value: f, label: f })),
    },
    {
      tipo: "texto",
      clave: "objeto",
      etiqueta: "Objeto",
      seccion: "Contratación",
      placeholder: "Filtrar por objeto…",
    },
    {
      tipo: "select",
      clave: "estado",
      etiqueta: "Estado",
      seccion: "Contratación",
      opciones: [...ESTADO_FILTRO_OPCIONES],
    },
    {
      tipo: "select",
      clave: "resultado",
      etiqueta: "Resultado",
      seccion: "Contratación",
      opciones: [...RESULTADO_FILTRO_OPCIONES],
    },
    {
      tipo: "moneda",
      clave: "cuantiaMin",
      etiqueta: "Cuantía mínima",
      seccion: "Financiera",
      placeholder: "$0",
    },
    {
      tipo: "moneda",
      clave: "cuantiaMax",
      etiqueta: "Cuantía máxima",
      seccion: "Financiera",
      placeholder: "Sin límite",
    },
    {
      tipo: "fechas",
      claveDesde: "detectadoDesde",
      claveHasta: "detectadoHasta",
      etiqueta: "Detectado",
      seccion: "Fechas",
    },
    {
      tipo: "fechas",
      claveDesde: "presentacionDesde",
      claveHasta: "presentacionHasta",
      etiqueta: "Fecha de presentación",
      seccion: "Fechas",
    },
  ];

  const valoresFiltro: ValoresFiltro = {
    entidad: filtros.entidad,
    modalidad: filtros.modalidad,
    fase: filtros.fase,
    objeto: filtros.objeto,
    estado: filtros.estado,
    resultado: filtros.resultado,
    cuantiaMin: filtros.cuantiaMin,
    cuantiaMax: filtros.cuantiaMax,
    detectadoDesde: filtros.detectadoDesde,
    detectadoHasta: filtros.detectadoHasta,
    presentacionDesde: filtros.presentacionDesde,
    presentacionHasta: filtros.presentacionHasta,
  };

  const aplicarFiltros = (v: ValoresFiltro) =>
    aplicar({
      entidad: v.entidad,
      modalidad: v.modalidad,
      fase: v.fase,
      objeto: v.objeto,
      estado: v.estado,
      resultado: v.resultado,
      cuantiaMin: v.cuantiaMin,
      cuantiaMax: v.cuantiaMax,
      detectadoDesde: v.detectadoDesde,
      detectadoHasta: v.detectadoHasta,
      presentacionDesde: v.presentacionDesde,
      presentacionHasta: v.presentacionHasta,
    });

  const aplicar = (cambios: Partial<FiltrosState>) => {
    const next = {
      buscar: cambios.buscar ?? buscar,
      entidad: cambios.entidad ?? filtros.entidad,
      objeto: cambios.objeto ?? filtros.objeto,
      modalidad: cambios.modalidad ?? filtros.modalidad,
      fase: cambios.fase ?? filtros.fase,
      cuantiaMin: cambios.cuantiaMin ?? filtros.cuantiaMin,
      cuantiaMax: cambios.cuantiaMax ?? filtros.cuantiaMax,
      detectadoDesde: cambios.detectadoDesde ?? filtros.detectadoDesde,
      detectadoHasta: cambios.detectadoHasta ?? filtros.detectadoHasta,
      presentacionDesde: cambios.presentacionDesde ?? filtros.presentacionDesde,
      presentacionHasta: cambios.presentacionHasta ?? filtros.presentacionHasta,
      estado: cambios.estado ?? filtros.estado,
      resultado: cambios.resultado ?? filtros.resultado,
    };

    const qs = new URLSearchParams();
    if (next.buscar.trim()) qs.set("buscar", next.buscar.trim());
    if (next.entidad.trim()) qs.set("entidad", next.entidad.trim());
    if (next.objeto.trim()) qs.set("objeto", next.objeto.trim());
    if (next.modalidad) qs.set("modalidad", next.modalidad);
    if (next.fase) qs.set("fase", next.fase);
    if (next.cuantiaMin.trim()) qs.set("cuantiaMin", next.cuantiaMin.trim());
    if (next.cuantiaMax.trim()) qs.set("cuantiaMax", next.cuantiaMax.trim());
    if (next.detectadoDesde) qs.set("detectadoDesde", next.detectadoDesde);
    if (next.detectadoHasta) qs.set("detectadoHasta", next.detectadoHasta);
    if (next.presentacionDesde) qs.set("presentacionDesde", next.presentacionDesde);
    if (next.presentacionHasta) qs.set("presentacionHasta", next.presentacionHasta);
    if (next.estado) qs.set("estado", next.estado);
    if (next.resultado) qs.set("resultado", next.resultado);

    startBuscar(() => {
      router.push(qs.size > 0 ? `${pathname}?${qs}` : pathname);
    });
  };

  const limpiarFiltros = () => {
    setBuscar("");
    startBuscar(() => {
      router.push(pathname);
    });
  };

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
      key: "proceso",
      title: "Proceso",
      width: "48%",
      render: (r) => (
        <div className="flex items-start justify-between gap-4">
          <ProcessIdentityCell
            identifier={r.secopId}
            source={r.dataset ? (datasetLabels[r.dataset] ?? r.dataset) : null}
            title={r.objeto || r.titulo}
            entity={r.entidad}
          />
          <div className="shrink-0">
            <MoneyCell value={r.valor} />
          </div>
        </div>
      ),
    },
    {
      key: "detalle",
      title: "Detalle",
      width: "34%",
      render: (r) => (
        <ProcessFactsCell
          modalidad={r.modalidad}
          estado={
            r.resultado
              ? `${ESTADO_LABEL[r.estado]} · ${RESULTADO_LABELS[r.resultado] ?? r.resultado}`
              : ESTADO_LABEL[r.estado]
          }
          fase={r.fase}
        />
      ),
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

  return (
    <div className="space-y-3">
      <FiltrosPanel
        campos={campos}
        valores={valoresFiltro}
        onAplicar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        deshabilitado={isBuscando}
        buscador={
          <div className="flex gap-1.5">
            <ItcInput
              value={buscar}
              placeholder="Entidad u objeto…"
              onChange={(
                e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
              ) => setBuscar(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aplicar({ buscar });
                }
              }}
            />
            <ItcButton type="button" variant="secondary" onClick={() => aplicar({ buscar })}>
              <Search className="h-4 w-4" />
            </ItcButton>
          </div>
        }
      />

      {procesos.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No hay procesos en seguimiento. Promueve procesos desde Consulta SECOP.
        </div>
      ) : (
        <div className="process-table">
          <ItcTable
            data={procesos}
            columns={columns}
            rowKey={(r) => r.id}
            pagination={false}
            tableLayout="fixed"
            responsiveStrategy="cards"
            hoverable
            stickyHeader
            ariaLabel="Tabla de procesos en seguimiento"
          />
        </div>
      )}

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
                    type="text"
                    inputMode="numeric"
                    value={formatMilesInput(valorAdjudicado)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                      setValorAdjudicado(parseMilesInput(e.target.value))
                    }
                    placeholder="Ej: 500.000.000"
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
    </div>
  );
}
