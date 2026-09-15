"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, type ChangeEvent } from "react";
import { ExternalLink, ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  ItcTable,
  type TableColumn,
  ItcModal,
  ItcInput,
  ItcButton,
  ItcDateRangePicker,
} from "@/components/itc";
import type { DateRange } from "react-day-picker";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCOP, formatDate, formatMilesInput, parseMilesInput } from "@/lib/format";
import {
  RESULTADO_OPCIONES,
  opcionesMarcarDisponibles,
  type ProcesoSeguimientoRow,
  type SeguimientoFiltrosDisponibles,
} from "@/lib/seguimiento-shared";
import { SelectConOtro, TODOS } from "../secop/select-con-otro";
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

function toIsoDate(d: Date | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

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
  const [objeto, setObjeto] = useState(filtros.objeto);
  const [cuantiaMin, setCuantiaMin] = useState(filtros.cuantiaMin);
  const [cuantiaMax, setCuantiaMax] = useState(filtros.cuantiaMax);
  const [marcarTarget, setMarcarTarget] = useState<{
    proceso: ProcesoSeguimientoRow;
    resultado: string;
    label: string;
  } | null>(null);
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [valorAdjudicado, setValorAdjudicado] = useState("");
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState("");

  const hasFiltrosAvanzadosActivos = Boolean(
    filtros.entidad || filtros.objeto || filtros.modalidad || filtros.fase ||
    filtros.cuantiaMin || filtros.cuantiaMax ||
    filtros.detectadoDesde || filtros.detectadoHasta ||
    filtros.presentacionDesde || filtros.presentacionHasta ||
    filtros.estado || filtros.resultado,
  );
  const [mostrarFiltros, setMostrarFiltros] = useState(hasFiltrosAvanzadosActivos);

  const aplicar = (cambios: Partial<FiltrosState>) => {
    const next = {
      buscar: cambios.buscar ?? buscar,
      entidad: cambios.entidad ?? filtros.entidad,
      objeto: cambios.objeto ?? objeto,
      modalidad: cambios.modalidad ?? filtros.modalidad,
      fase: cambios.fase ?? filtros.fase,
      cuantiaMin: cambios.cuantiaMin ?? cuantiaMin,
      cuantiaMax: cambios.cuantiaMax ?? cuantiaMax,
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
    setObjeto("");
    setCuantiaMin("");
    setCuantiaMax("");
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
      key: "entidad",
      title: "Entidad",
      width: "13%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.entidad ?? undefined}>
          {r.entidad ?? "—"}
        </span>
      ),
    },
    {
      key: "objeto",
      title: "Objeto",
      width: "18%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.objeto ?? undefined}>
          {r.objeto ?? "—"}
        </span>
      ),
    },
    {
      key: "modalidad",
      title: "Modalidad",
      width: "10%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.modalidad ?? undefined}>
          {r.modalidad ?? "—"}
        </span>
      ),
    },
    {
      key: "titulo",
      title: "Proceso",
      width: "16%",
      render: (r) => (
        <span className="block truncate font-medium" title={r.titulo ?? r.secopId ?? undefined}>
          {r.titulo ?? r.secopId}
        </span>
      ),
    },
    {
      key: "valor",
      title: "Cuantía",
      width: "9%",
      align: "right",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>
      ),
    },
    {
      key: "fechaPresentacionOferta",
      title: "Presentación",
      width: "9%",
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

  return (
    <div className="space-y-6">
      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1.5">Buscar</Label>
              <div className="flex gap-1.5">
                <ItcInput
                  value={buscar}
                  placeholder="Entidad u objeto…"
                  onChange={(
                    e: ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => setBuscar(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      aplicar({ buscar });
                    }
                  }}
                />
                <ItcButton
                  type="button"
                  variant="secondary"
                  onClick={() => aplicar({ buscar })}
                >
                  <Search className="h-4 w-4" />
                </ItcButton>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <ItcButton
                type="button"
                variant="secondary"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="gap-1.5"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {mostrarFiltros ? "Ocultar filtros" : "Filtros avanzados"}
              </ItcButton>
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <SelectConOtro
                label="Entidad"
                value={filtros.entidad}
                opciones={filtrosDisponibles.entidades}
                placeholderTodos="Todas"
                onChange={(value) => aplicar({ entidad: value })}
              />

              <SelectConOtro
                label="Modalidad"
                value={filtros.modalidad}
                opciones={filtrosDisponibles.modalidades}
                placeholderTodos="Todas"
                onChange={(value) => aplicar({ modalidad: value })}
              />

              <div>
                <Label className="mb-1.5">Fase</Label>
                <ItcInput
                  type="select"
                  value={filtros.fase || TODOS}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    aplicar({ fase: e.target.value === TODOS ? "" : e.target.value })
                  }
                >
                  <option value={TODOS}>Todas</option>
                  {filtrosDisponibles.fases.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </ItcInput>
              </div>

              <div>
                <Label className="mb-1.5">Objeto</Label>
                <ItcInput
                  value={objeto}
                  placeholder="Filtrar por objeto…"
                  onChange={(
                    e: ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => setObjeto(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      aplicar({ objeto });
                    }
                  }}
                />
              </div>

              <div>
                <Label className="mb-1.5">Cuantía mínima</Label>
                <ItcInput
                  type="text"
                  inputMode="numeric"
                  value={formatMilesInput(cuantiaMin)}
                  placeholder="$0"
                  onChange={(
                    e: ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => setCuantiaMin(parseMilesInput(e.target.value))}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      aplicar({ cuantiaMin });
                    }
                  }}
                />
              </div>

              <div>
                <Label className="mb-1.5">Cuantía máxima</Label>
                <ItcInput
                  type="text"
                  inputMode="numeric"
                  value={formatMilesInput(cuantiaMax)}
                  placeholder="Sin límite"
                  onChange={(
                    e: ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >,
                  ) => setCuantiaMax(parseMilesInput(e.target.value))}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      aplicar({ cuantiaMax });
                    }
                  }}
                />
              </div>

              <div className="lg:col-span-2">
                <ItcDateRangePicker
                  label="Detectado"
                  placeholder="Rango de fechas…"
                  clearable
                  value={
                    {
                      from: fromIsoDate(filtros.detectadoDesde),
                      to: fromIsoDate(filtros.detectadoHasta),
                    } as DateRange
                  }
                  onChange={(range) =>
                    aplicar({
                      detectadoDesde: toIsoDate(range?.from),
                      detectadoHasta: toIsoDate(range?.to),
                    })
                  }
                />
              </div>

              <div className="lg:col-span-2">
                <ItcDateRangePicker
                  label="Fecha de presentación"
                  placeholder="Rango de fechas…"
                  clearable
                  value={
                    {
                      from: fromIsoDate(filtros.presentacionDesde),
                      to: fromIsoDate(filtros.presentacionHasta),
                    } as DateRange
                  }
                  onChange={(range) =>
                    aplicar({
                      presentacionDesde: toIsoDate(range?.from),
                      presentacionHasta: toIsoDate(range?.to),
                    })
                  }
                />
              </div>

              <div>
                <Label className="mb-1.5">Estado</Label>
                <ItcInput
                  type="select"
                  value={filtros.estado || TODOS}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    aplicar({ estado: e.target.value === TODOS ? "" : e.target.value })
                  }
                >
                  <option value={TODOS}>Todos</option>
                  {ESTADO_FILTRO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </ItcInput>
              </div>

              <div>
                <Label className="mb-1.5">Resultado</Label>
                <ItcInput
                  type="select"
                  value={filtros.resultado || TODOS}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    aplicar({ resultado: e.target.value === TODOS ? "" : e.target.value })
                  }
                >
                  <option value={TODOS}>Todos</option>
                  {RESULTADO_FILTRO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </ItcInput>
              </div>

              <div className="flex items-end">
                <ItcButton
                  type="button"
                  variant="secondary"
                  onClick={limpiarFiltros}
                  className="w-full"
                  disabled={isBuscando}
                >
                  Limpiar filtros
                </ItcButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {procesos.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No hay procesos en seguimiento. Promueve procesos desde Consulta SECOP.
        </div>
      ) : (
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
