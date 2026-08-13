"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  RefreshCw,
  Search,
  Eye,
  XCircle,
  Info,
  Star,
} from "lucide-react";
import {
  ItcTable,
  type TableColumn,
  ItcButton,
  ItcInput,
  ItcModal,
  ItcDateRangePicker,
} from "@/components/itc";
import type { DateRange } from "react-day-picker";
import { DetalleProcesoModal } from "./detalle-proceso-modal";
import { SelectConOtro, TODOS } from "./select-con-otro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { RowActionButton } from "@/components/layout/row-action-button";
import { formatCOP, formatDate, formatDateTime } from "@/lib/format";
import {
  datasetLabels,
  type Paginado,
  type ProcesoRow,
  type SincronizacionRow,
  type SecopFiltros,
} from "@/lib/secop-shared";
import { sincronizarSecop, promoverProceso, descartarProceso } from "./actions";

const PAGE_SIZES = [10, 25, 50, 100] as const;

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

const estadoTone: Record<string, Tone> = {
  ok: "success",
  sin_novedades: "muted",
  error: "danger",
  running: "info",
};

const estadoLabel: Record<string, string> = {
  ok: "Completada",
  sin_novedades: "Sin novedades",
  error: "Con error",
  running: "En curso",
};

type FiltrosState = {
  dataset: string;
  soloNuevos: boolean;
  buscar: string;
  entidad: string;
  objeto: string;
  modalidad: string;
  estado: string;
  fase: string;
  cuantiaMin: string;
  cuantiaMax: string;
  detectadoDesde: string;
  detectadoHasta: string;
  pageSize: number;
};

export function ProcesosSecopView({
  procesos,
  sincronizaciones,
  filtros,
  filtrosDisponibles,
  entidadesDisponibles,
  esAdmin,
}: {
  procesos: Paginado<ProcesoRow>;
  sincronizaciones: SincronizacionRow[];
  filtros: FiltrosState;
  filtrosDisponibles: SecopFiltros;
  entidadesDisponibles: string[];
  esAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Separado de isPending (promover/descartar): así el modal de carga de la
  // búsqueda no aparece encima del modal de confirmación de esas acciones.
  const [isBuscando, startBuscar] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, startSync] = useTransition();
  const [buscar, setBuscar] = useState(filtros.buscar);
  const [objeto, setObjeto] = useState(filtros.objeto);
  const [cuantiaMin, setCuantiaMin] = useState(filtros.cuantiaMin);
  const [cuantiaMax, setCuantiaMax] = useState(filtros.cuantiaMax);
  const [promoverTarget, setPromoverTarget] = useState<ProcesoRow | null>(null);
  const [descartarTarget, setDescartarTarget] = useState<ProcesoRow | null>(null);
  const [descartarMotivo, setDescartarMotivo] = useState("");
  const [detalleTarget, setDetalleTarget] = useState<ProcesoRow | null>(null);

  const aplicar = (
    cambios: Partial<FiltrosState & { page: number }>,
  ) => {
    const next = {
      dataset: cambios.dataset ?? filtros.dataset,
      nuevos: cambios.soloNuevos ?? filtros.soloNuevos,
      buscar: cambios.buscar ?? buscar,
      entidad: cambios.entidad ?? filtros.entidad,
      objeto: cambios.objeto ?? objeto,
      modalidad: cambios.modalidad ?? filtros.modalidad,
      estado: cambios.estado ?? filtros.estado,
      fase: cambios.fase ?? filtros.fase,
      cuantiaMin: cambios.cuantiaMin ?? cuantiaMin,
      cuantiaMax: cambios.cuantiaMax ?? cuantiaMax,
      detectadoDesde: cambios.detectadoDesde ?? filtros.detectadoDesde,
      detectadoHasta: cambios.detectadoHasta ?? filtros.detectadoHasta,
      pageSize: cambios.pageSize ?? filtros.pageSize,
      page: cambios.page ?? 1,
    };

    const qs = new URLSearchParams();
    if (next.dataset) qs.set("dataset", next.dataset);
    if (next.nuevos) qs.set("nuevos", "1");
    if (next.buscar.trim()) qs.set("buscar", next.buscar.trim());
    if (next.entidad.trim()) qs.set("entidad", next.entidad.trim());
    if (next.objeto.trim()) qs.set("objeto", next.objeto.trim());
    if (next.modalidad) qs.set("modalidad", next.modalidad);
    if (next.estado) qs.set("estado", next.estado);
    if (next.fase) qs.set("fase", next.fase);
    if (next.cuantiaMin.trim()) qs.set("cuantiaMin", next.cuantiaMin.trim());
    if (next.cuantiaMax.trim()) qs.set("cuantiaMax", next.cuantiaMax.trim());
    if (next.detectadoDesde) qs.set("detectadoDesde", next.detectadoDesde);
    if (next.detectadoHasta) qs.set("detectadoHasta", next.detectadoHasta);
    if (next.pageSize !== 25) qs.set("pageSize", String(next.pageSize));
    if (next.page > 1) qs.set("page", String(next.page));

    startBuscar(() => {
      router.push(qs.size > 0 ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleSincronizar = () => {
    startSync(async () => {
      try {
        await sincronizarSecop();
        toast.success("Sincronización iniciada", {
          description:
            "El proceso corre en segundo plano y puede tardar unos minutos. Revisa 'Últimas sincronizaciones' para ver el resultado.",
        });
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo encolar la sincronización",
        );
      }
    });
  };

  const handlePromover = () => {
    if (!promoverTarget) return;
    const id = promoverTarget.id;
    startTransition(async () => {
      try {
        await promoverProceso(id);
        toast.success("Proceso promovido a seguimiento");
        setPromoverTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo promover el proceso",
        );
      }
    });
  };

  const handleDescartar = () => {
    if (!descartarTarget) return;
    const id = descartarTarget.id;
    startTransition(async () => {
      try {
        await descartarProceso(id, descartarMotivo || undefined);
        toast.success("Proceso descartado");
        setDescartarTarget(null);
        setDescartarMotivo("");
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo descartar el proceso",
        );
      }
    });
  };

  // tableLayout="fixed" + un ancho por columna: así el texto largo trunca con
  // "…" (ver className="truncate") en vez de ensanchar la tabla y forzar
  // scroll horizontal. "Proceso" (título) y "Fuente" no son columnas propias
  // del requerimiento de negocio; quedan disponibles en el modal de detalle.
  const columns: TableColumn<ProcesoRow>[] = [
    {
      key: "entidad",
      title: "Entidad",
      width: "20%",
      render: (r) => (
        <span className="flex items-center gap-1 truncate text-sm text-muted-foreground" title={r.entidad ?? undefined}>
          {r.entidadRegistrada && (
            <span title="Entidad registrada en Administración">
              <Star className="h-3 w-3 shrink-0 text-yellow-500" />
            </span>
          )}
          {r.entidad ?? "—"}
        </span>
      ),
    },
    {
      key: "objeto",
      title: "Objeto",
      width: "24%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.objeto ?? undefined}>
          {r.objeto ?? "—"}
        </span>
      ),
    },
    {
      key: "modalidad",
      title: "Modalidad",
      width: "13%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.modalidad ?? undefined}>
          {r.modalidad ?? "—"}
        </span>
      ),
    },
    {
      key: "estado",
      title: "Estado",
      width: "11%",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm text-muted-foreground" title={r.estado ?? undefined}>
            {r.estado ?? "—"}
          </span>
          {r.esNuevo && <StatusBadge tone="info">Nuevo</StatusBadge>}
        </div>
      ),
    },
    {
      key: "fase",
      title: "Fase",
      width: "10%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.fase ?? undefined}>
          {r.fase ?? "—"}
        </span>
      ),
    },
    {
      key: "valor",
      title: "Cuantía",
      width: "10%",
      align: "right",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>
      ),
    },
    {
      key: "detectadoEl",
      title: "Detectado",
      width: "9%",
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(r.detectadoEl)}
        </span>
      ),
    },
    {
      key: "acciones",
      title: "",
      width: 130,
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <RowActionButton
            icon={<Info className="h-3.5 w-3.5" />}
            title="Ver detalle"
            onClick={() => setDetalleTarget(r)}
          />
          {r.url && (
            <RowActionButton
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              title="Abrir en SECOP"
              href={r.url}
            />
          )}
          {!r.promovido && (
            <RowActionButton
              icon={<Eye className="h-3.5 w-3.5" />}
              title="Promover a seguimiento"
              onClick={() => setPromoverTarget(r)}
            />
          )}
          {!r.descartado && (
            <RowActionButton
              icon={<XCircle className="h-3.5 w-3.5" />}
              title="Descartar proceso"
              onClick={() => setDescartarTarget(r)}
            />
          )}
        </div>
      ),
    },
  ];

  const totalPaginas = Math.max(
    Math.ceil(procesos.total / procesos.pageSize),
    1,
  );
  const totalSinFiltrar = filtrosDisponibles.totalSinFiltrar;

  return (
    <div className="space-y-6">
      {/* overflow-visible: el Card de shadcn trae overflow-hidden por defecto,
          y el calendario de ItcDateRangePicker se posiciona con position:
          absolute dentro de este mismo contenedor (no usa portal a
          document.body) — sin este override, el Card le corta la grilla de
          días y solo se ve el encabezado del mes. */}
      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Filtros</CardTitle>
          {esAdmin && (
            <ItcButton onClick={handleSincronizar} disabled={isSyncing}>
              {isSyncing ? (
                <Spinner className="size-3.5" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isSyncing ? "Encolando…" : "Sincronizar ahora"}
            </ItcButton>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label className="mb-1.5">Buscar</Label>
            <div className="flex gap-1.5">
              <ItcInput
                value={buscar}
                placeholder="Título, entidad u objeto…"
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

          <SelectConOtro
            label="Entidad"
            value={filtros.entidad}
            opciones={entidadesDisponibles}
            placeholderTodos="Todas"
            onChange={(value) => aplicar({ entidad: value })}
          />

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
            <Label className="mb-1.5">Fuente</Label>
            <ItcInput
              type="select"
              value={filtros.dataset || TODOS}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ dataset: e.target.value === TODOS ? "" : e.target.value })
              }
            >
              <option value={TODOS}>Todas</option>
              <option value="secop_i">SECOP I</option>
              <option value="secop_ii">SECOP II</option>
            </ItcInput>
          </div>

          <SelectConOtro
            label="Modalidad"
            value={filtros.modalidad}
            opciones={filtrosDisponibles.modalidades}
            placeholderTodos="Todas"
            onChange={(value) => aplicar({ modalidad: value })}
          />

          <SelectConOtro
            label="Estado"
            value={filtros.estado}
            opciones={filtrosDisponibles.estados}
            placeholderTodos="Todos"
            onChange={(value) => aplicar({ estado: value })}
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
            <Label className="mb-1.5">Cuantía mínima</Label>
            <ItcInput
              type="number"
              value={cuantiaMin}
              placeholder="$0"
              onChange={(
                e: ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >,
              ) => setCuantiaMin(e.target.value)}
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
              type="number"
              value={cuantiaMax}
              placeholder="Sin límite"
              onChange={(
                e: ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >,
              ) => setCuantiaMax(e.target.value)}
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

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={filtros.soloNuevos}
                onCheckedChange={(checked) => aplicar({ soloNuevos: checked })}
              />
              Solo nuevos
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {procesos.total === 0
              ? "Sin resultados"
              : `${procesos.total} de ${totalSinFiltrar} proceso${totalSinFiltrar === 1 ? "" : "s"}`}
          </p>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Filas</Label>
            <ItcInput
              type="select"
              className="w-20"
              value={String(filtros.pageSize)}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                aplicar({ pageSize: Number(e.target.value) })
              }
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </ItcInput>
            {isBuscando && <Spinner className="size-3.5 text-muted-foreground" />}
          </div>
        </div>

        {procesos.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No hay procesos detectados todavía. Revisa la paramétrica de búsqueda en Administración y espera a la
            próxima sincronización.
          </div>
        ) : (
          <>
            <ItcTable
              data={procesos.items}
              columns={columns}
              rowKey={(r) => r.id}
              pagination={false}
              tableLayout="fixed"
              striped
              hoverable
              stickyHeader
            />

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between">
                <ItcButton
                  type="button"
                  variant="secondary"
                  disabled={procesos.page <= 1 || isBuscando}
                  onClick={() => aplicar({ page: procesos.page - 1 })}
                >
                  Anterior
                </ItcButton>
                <span className="text-sm text-muted-foreground">
                  Página {procesos.page} de {totalPaginas}
                </span>
                <ItcButton
                  type="button"
                  variant="secondary"
                  disabled={procesos.page >= totalPaginas || isBuscando}
                  onClick={() => aplicar({ page: procesos.page + 1 })}
                >
                  Siguiente
                </ItcButton>
              </div>
            )}
          </>
        )}
      </div>

      {esAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas sincronizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {sincronizaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no se ha ejecutado ninguna sincronización.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {sincronizaciones.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
                  >
                    <StatusBadge tone={estadoTone[s.estado] ?? "muted"}>
                      {estadoLabel[s.estado] ?? s.estado}
                    </StatusBadge>
                    <span className="font-medium">
                      {datasetLabels[s.dataset] ?? s.dataset}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateTime(s.inicio)}
                    </span>
                    {(s.estado === "ok" || s.estado === "sin_novedades") && (
                      <span className="text-muted-foreground">
                        {s.consultados} consultados · {s.insertados} nuevos ·{" "}
                        {s.actualizados} actualizados
                      </span>
                    )}
                    {s.errorMessage && (
                      <span className="text-destructive">
                        {s.errorCode}: {s.errorMessage}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <ItcModal
        open={promoverTarget !== null}
        onClose={() => setPromoverTarget(null)}
        onConfirm={handlePromover}
        title="¿Promover a seguimiento?"
        content={
          <p className="text-sm text-muted-foreground">
            El proceso{" "}
            <span className="font-medium">
              {promoverTarget?.titulo ?? promoverTarget?.secopId}
            </span>{" "}
            aparecerá en &quot;Procesos en seguimiento&quot;.
          </p>
        }
        variant="confirm"
        confirmText="Promover"
        disabled={isPending}
      />

      <ItcModal
        open={descartarTarget !== null}
        onClose={() => {
          setDescartarTarget(null);
          setDescartarMotivo("");
        }}
        onConfirm={handleDescartar}
        title="¿Descartar proceso?"
        content={
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              El proceso{" "}
              <span className="font-medium">
                {descartarTarget?.titulo ?? descartarTarget?.secopId}
              </span>{" "}
              se ocultará de los resultados.
            </p>
            <div>
              <Label className="mb-1.5">Motivo (opcional)</Label>
              <ItcInput
                value={descartarMotivo}
                onChange={(
                  e: ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >,
                ) => setDescartarMotivo(e.target.value)}
                placeholder="Razón del descarte…"
              />
            </div>
          </div>
        }
        variant="confirm"
        confirmText="Descartar"
        disabled={isPending}
      />

      <DetalleProcesoModal
        proceso={
          detalleTarget && {
            titulo: detalleTarget.titulo,
            secopId: detalleTarget.secopId,
            dataset: detalleTarget.dataset,
            entidad: detalleTarget.entidad,
            objeto: detalleTarget.objeto,
            modalidad: detalleTarget.modalidad,
            estado: detalleTarget.estado,
            fase: detalleTarget.fase,
            valor: detalleTarget.valor,
            fechaPublicacion: detalleTarget.fechaPublicacion,
            fechaCierre: detalleTarget.fechaCierre,
            detectadoEl: detalleTarget.detectadoEl,
            url: detalleTarget.url,
            esNuevo: detalleTarget.esNuevo,
            promovido: detalleTarget.promovido,
            descartado: detalleTarget.descartado,
          }
        }
        onClose={() => setDetalleTarget(null)}
      />

      {isBuscando && <LoadingOverlay />}
    </div>
  );
}
