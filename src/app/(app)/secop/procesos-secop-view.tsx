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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP, formatDate, formatDateTime } from "@/lib/format";
import {
  datasetLabels,
  type Paginado,
  type ProcesoRow,
  type SincronizacionRow,
  type SecopFiltros,
} from "@/lib/secop-shared";
import { sincronizarSecop, promoverProceso, descartarProceso } from "./actions";

const TODOS = "todos";
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
  error: "danger",
  running: "info",
};

const estadoLabel: Record<string, string> = {
  ok: "Completada",
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
  esAdmin,
  vista = "detectados",
}: {
  procesos: Paginado<ProcesoRow>;
  sincronizaciones: SincronizacionRow[];
  filtros: FiltrosState;
  filtrosDisponibles: SecopFiltros;
  esAdmin: boolean;
  vista?: "detectados" | "monitoreadas";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, startSync] = useTransition();
  const [buscar, setBuscar] = useState(filtros.buscar);
  const [entidad, setEntidad] = useState(filtros.entidad);
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
      entidad: cambios.entidad ?? entidad,
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
    if (vista !== "detectados") qs.set("vista", vista);
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

    startTransition(() => {
      router.push(qs.size > 0 ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleSincronizar = () => {
    startSync(async () => {
      try {
        await sincronizarSecop();
        toast.success("Sincronización encolada", {
          description:
            "Los resultados aparecerán en unos minutos. Actualiza la página para verlos.",
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
        <span className="block truncate text-sm text-muted-foreground" title={r.entidad ?? undefined}>
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
          <ItcButton
            className="p-1.5 hover:bg-muted rounded"
            onClick={() => setDetalleTarget(r)}
            title="Ver detalle"
          >
            <Info className="h-3.5 w-3.5" />
          </ItcButton>
          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded p-1.5 hover:bg-muted"
              title="Abrir en SECOP"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {!r.promovido && (
            <ItcButton
              className="p-1.5 hover:bg-muted rounded"
              onClick={() => setPromoverTarget(r)}
              title="Promover a seguimiento"
            >
              <Eye className="h-3.5 w-3.5" />
            </ItcButton>
          )}
          {!r.descartado && (
            <ItcButton
              className="p-1.5 hover:bg-muted rounded"
              onClick={() => setDescartarTarget(r)}
              title="Descartar proceso"
            >
              <XCircle className="h-3.5 w-3.5" />
            </ItcButton>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Filtros</CardTitle>
          {esAdmin && vista === "detectados" && (
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
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div>
            <Label className="mb-1.5">Entidad</Label>
            <ItcInput
              value={entidad}
              placeholder="Filtrar por entidad…"
              onChange={(
                e: ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >,
              ) => setEntidad(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aplicar({ entidad });
                }
              }}
            />
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
            <Label className="mb-1.5">Fuente</Label>
            <Select
              value={filtros.dataset || TODOS}
              onValueChange={(value) =>
                aplicar({ dataset: value === TODOS ? "" : value })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                <SelectItem value="secop_i">SECOP I</SelectItem>
                <SelectItem value="secop_ii">SECOP II</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5">Modalidad</Label>
            <Select
              value={filtros.modalidad || TODOS}
              onValueChange={(value) =>
                aplicar({ modalidad: value === TODOS ? "" : value })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {filtrosDisponibles.modalidades.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5">Estado</Label>
            <Select
              value={filtros.estado || TODOS}
              onValueChange={(value) =>
                aplicar({ estado: value === TODOS ? "" : value })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {filtrosDisponibles.estados.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5">Fase</Label>
            <Select
              value={filtros.fase || TODOS}
              onValueChange={(value) =>
                aplicar({ fase: value === TODOS ? "" : value })
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {filtrosDisponibles.fases.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {vista === "detectados" && (
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={filtros.soloNuevos}
                  onCheckedChange={(checked) => aplicar({ soloNuevos: checked })}
                />
                Solo nuevos
              </label>
            </div>
          )}
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
            <Select
              value={String(filtros.pageSize)}
              onValueChange={(v) => aplicar({ pageSize: Number(v) })}
            >
              <SelectTrigger size="sm" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPending && <Spinner className="size-3.5 text-muted-foreground" />}
          </div>
        </div>

        {procesos.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {vista === "monitoreadas"
              ? "No hay procesos detectados para entidades en seguimiento permanente. Marca entidades como \"Seguimiento permanente\" en Administración."
              : "No hay procesos detectados todavía. Revisa la paramétrica de búsqueda en Administración y espera a la próxima sincronización."}
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
                  disabled={procesos.page <= 1 || isPending}
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
                  disabled={procesos.page >= totalPaginas || isPending}
                  onClick={() => aplicar({ page: procesos.page + 1 })}
                >
                  Siguiente
                </ItcButton>
              </div>
            )}
          </>
        )}
      </div>

      {esAdmin && vista === "detectados" && (
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
                    {s.estado === "ok" && (
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
    </div>
  );
}
