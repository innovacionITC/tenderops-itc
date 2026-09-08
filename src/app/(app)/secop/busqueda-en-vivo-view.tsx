"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Search,
  Info,
  Eye,
  XCircle,
  SlidersHorizontal,
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
import { SelectConOtro } from "./select-con-otro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { RowActionButton } from "@/components/layout/row-action-button";
import { formatCOP, formatDate } from "@/lib/format";
import type { BuscarEnVivoRow, SecopFiltros } from "@/lib/secop-shared";
import {
  buscarEnVivoAction,
  promoverProcesoEnVivo,
  descartarProcesoEnVivo,
} from "./actions";

type Criterios = {
  keyword: string;
  dataset: string;
  entidad: string;
  nit: string;
  numeroProceso: string;
  objeto: string;
  modalidad: string;
  estado: string;
  departamento: string;
  ciudad: string;
  unspsc: string;
  publicadoDesde: string;
  publicadoHasta: string;
  cuantiaMin: string;
  cuantiaMax: string;
};

const PAGE_SIZES = [10, 25, 50, 100] as const;

const CRITERIOS_INICIALES: Criterios = {
  keyword: "",
  dataset: "secop_ii",
  entidad: "",
  nit: "",
  numeroProceso: "",
  objeto: "",
  modalidad: "",
  estado: "",
  departamento: "",
  ciudad: "",
  unspsc: "",
  publicadoDesde: "",
  publicadoHasta: "",
  cuantiaMin: "",
  cuantiaMax: "",
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

export function BusquedaEnVivoView({
  filtrosDisponibles,
  entidadesDisponibles,
  departamentosDisponibles,
  ciudadesDisponibles,
}: {
  filtrosDisponibles: SecopFiltros;
  entidadesDisponibles: string[];
  departamentosDisponibles: string[];
  ciudadesDisponibles: string[];
}) {
  const [criterios, setCriterios] = useState<Criterios>(CRITERIOS_INICIALES);
  const [rows, setRows] = useState<BuscarEnVivoRow[] | null>(null);
  // Dataset con el que realmente se ejecutó la búsqueda vigente — separado de
  // criterios.dataset porque ese selector se puede cambiar después de buscar
  // (sin volver a buscar) y las filas en pantalla no llevan su propio dataset;
  // usar el selector "en vivo" para promover/descartar/ver detalle etiquetaría
  // el proceso con la plataforma equivocada.
  const [datasetBuscado, setDatasetBuscado] = useState(criterios.dataset);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [buscada, setBuscada] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [detalleTarget, setDetalleTarget] = useState<BuscarEnVivoRow | null>(null);
  const [promoverTarget, setPromoverTarget] = useState<BuscarEnVivoRow | null>(null);
  const [descartarTarget, setDescartarTarget] = useState<BuscarEnVivoRow | null>(null);
  const [descartarMotivo, setDescartarMotivo] = useState("");
  const [promovidos, setPromovidos] = useState<Set<string>>(new Set());
  const [descartados, setDescartados] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  const ejecutarBusqueda = (paginaDestino: number, tamañoDestino?: number) => {
    const tamaño = tamañoDestino ?? pageSize;
    const datasetUsado = criterios.dataset;
    startTransition(async () => {
      try {
        const res = await buscarEnVivoAction({
          dataset: datasetUsado,
          keyword: criterios.keyword.trim() || undefined,
          entidad: criterios.entidad.trim() || undefined,
          nit: criterios.nit.trim() || undefined,
          numeroProceso: criterios.numeroProceso.trim() || undefined,
          objeto: criterios.objeto.trim() || undefined,
          modalidad: criterios.modalidad.trim() || undefined,
          estado: criterios.estado.trim() || undefined,
          departamento: criterios.departamento.trim() || undefined,
          ciudad: criterios.ciudad.trim() || undefined,
          unspsc: criterios.unspsc.trim() || undefined,
          publicadoDesde: criterios.publicadoDesde || undefined,
          publicadoHasta: criterios.publicadoHasta || undefined,
          cuantiaMin: criterios.cuantiaMin ? Number(criterios.cuantiaMin) : undefined,
          cuantiaMax: criterios.cuantiaMax ? Number(criterios.cuantiaMax) : undefined,
          page: paginaDestino,
          pageSize: tamaño,
        });
        setRows(res.rows);
        setPage(res.page);
        setPageSize(tamaño);
        setDatasetBuscado(datasetUsado);
        setBuscada(true);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo completar la búsqueda en vivo",
        );
      }
    });
  };

  const handlePromover = () => {
    if (!promoverTarget) return;
    const row = promoverTarget;
    startActionTransition(async () => {
      try {
        await promoverProcesoEnVivo({
          dataset: datasetBuscado,
          secopId: row.secopId,
          title: row.titulo,
          entityName: row.entidad,
          entityNit: row.entityNit,
          subject: row.objeto,
          modality: row.modalidad,
          status: row.estado,
          value: row.valor,
          publicationDate: row.fechaPublicacion,
          closingDate: row.fechaCierre,
          phase: row.fase,
          secopUrl: row.url,
        });
        toast.success("Proceso promovido a seguimiento");
        setPromovidos((prev) => new Set(prev).add(row.secopId));
        setPromoverTarget(null);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo promover el proceso",
        );
      }
    });
  };

  const handleDescartar = () => {
    if (!descartarTarget) return;
    const row = descartarTarget;
    startActionTransition(async () => {
      try {
        await descartarProcesoEnVivo(
          {
            dataset: datasetBuscado,
            secopId: row.secopId,
            title: row.titulo,
            entityName: row.entidad,
            entityNit: row.entityNit,
            subject: row.objeto,
            modality: row.modalidad,
            status: row.estado,
            value: row.valor,
            publicationDate: row.fechaPublicacion,
            closingDate: row.fechaCierre,
            phase: row.fase,
            secopUrl: row.url,
          },
          descartarMotivo || undefined,
        );
        toast.success("Proceso descartado");
        setDescartados((prev) => new Set(prev).add(row.secopId));
        setDescartarTarget(null);
        setDescartarMotivo("");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo descartar el proceso",
        );
      }
    });
  };

  const limpiarFiltros = () => {
    setCriterios(CRITERIOS_INICIALES);
  };

  const columns: TableColumn<BuscarEnVivoRow>[] = [
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
      key: "secopId",
      title: "N. proceso",
      width: "10%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.secopId}>
          {r.secopId}
        </span>
      ),
    },
    {
      key: "objeto",
      title: "Objeto",
      width: "22%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.objeto ?? undefined}>
          {r.objeto ?? "—"}
        </span>
      ),
    },
    {
      key: "modalidad",
      title: "Modalidad",
      width: "12%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.modalidad ?? undefined}>
          {r.modalidad ?? "—"}
        </span>
      ),
    },
    {
      key: "estado",
      title: "Estado",
      width: "10%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.estado ?? undefined}>
          {r.estado ?? "—"}
        </span>
      ),
    },
    {
      key: "fechaPublicacion",
      title: "Publicación",
      width: "8%",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.fechaPublicacion)}</span>
      ),
    },
    {
      key: "fechaCierre",
      title: "Cierre",
      width: "8%",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.fechaCierre)}</span>
      ),
    },
    {
      key: "valor",
      title: "Cuantía",
      width: "8%",
      align: "right",
      render: (r) => <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>,
    },
    {
      key: "acciones",
      title: "Acciones",
      width: 120,
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
          {!promovidos.has(r.secopId) && !descartados.has(r.secopId) && (
            <RowActionButton
              icon={<Eye className="h-3.5 w-3.5" />}
              title="Promover a seguimiento"
              onClick={() => setPromoverTarget(r)}
              disabled={isActionPending}
            />
          )}
          {!descartados.has(r.secopId) && !promovidos.has(r.secopId) && (
            <RowActionButton
              icon={<XCircle className="h-3.5 w-3.5" />}
              title="Descartar proceso"
              onClick={() => setDescartarTarget(r)}
              disabled={isActionPending}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* overflow-visible: el Card de shadcn trae overflow-hidden por defecto,
          y el calendario de ItcDateRangePicker se posiciona con position:
          absolute dentro de este mismo contenedor (no usa portal a
          document.body) — sin este override, el Card le corta la grilla de
          días y solo se ve el encabezado del mes. */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Criterios de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1.5">Palabras clave</Label>
              <ItcInput
                value={criterios.keyword}
                placeholder="Buscar en título y objeto…"
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    ejecutarBusqueda(1);
                  }
                }}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setCriterios((c) => ({ ...c, keyword: e.target.value }))
                }
              />
            </div>

            <div>
              <Label className="mb-1.5">Fuente</Label>
              <ItcInput
                type="select"
                value={criterios.dataset}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setCriterios((c) => ({ ...c, dataset: e.target.value }))
                }
              >
                <option value="secop_i">SECOP I</option>
                <option value="secop_ii">SECOP II</option>
              </ItcInput>
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

            <div className="flex items-end">
              <ItcButton
                type="button"
                onClick={() => ejecutarBusqueda(1)}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? <Spinner className="size-3.5" /> : <Search className="h-4 w-4" />}
                Buscar en SECOP
              </ItcButton>
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <SelectConOtro
                label="Entidad"
                value={criterios.entidad}
                opciones={entidadesDisponibles}
                placeholderTodos="Todas las entidades"
                onChange={(v) => setCriterios((c) => ({ ...c, entidad: v }))}
              />

              <div>
                <Label className="mb-1.5">NIT</Label>
                <ItcInput
                  value={criterios.nit}
                  placeholder="Identificador exacto…"
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCriterios((c) => ({ ...c, nit: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="mb-1.5">N. proceso</Label>
                <ItcInput
                  value={criterios.numeroProceso}
                  placeholder="ID del proceso (exacto)…"
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCriterios((c) => ({ ...c, numeroProceso: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="mb-1.5">Objeto</Label>
                <ItcInput
                  value={criterios.objeto}
                  placeholder="Palabras del objeto…"
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCriterios((c) => ({ ...c, objeto: e.target.value }))
                  }
                />
              </div>

              <SelectConOtro
                label="Modalidad"
                value={criterios.modalidad}
                opciones={filtrosDisponibles.modalidades}
                placeholderTodos="Todas las modalidades"
                onChange={(v) => setCriterios((c) => ({ ...c, modalidad: v }))}
              />

              <SelectConOtro
                label="Estado"
                value={criterios.estado}
                opciones={filtrosDisponibles.estados}
                placeholderTodos="Todos los estados"
                onChange={(v) => setCriterios((c) => ({ ...c, estado: v }))}
              />

              <SelectConOtro
                label="Departamento"
                value={criterios.departamento}
                opciones={departamentosDisponibles}
                placeholderTodos="Todos los departamentos"
                onChange={(v) => setCriterios((c) => ({ ...c, departamento: v }))}
              />

              <SelectConOtro
                label="Ciudad"
                value={criterios.ciudad}
                opciones={ciudadesDisponibles}
                placeholderTodos="Todas las ciudades"
                onChange={(v) => setCriterios((c) => ({ ...c, ciudad: v }))}
              />

              <div>
                <Label className="mb-1.5">UNSPSC</Label>
                <ItcInput
                  value={criterios.unspsc}
                  placeholder="Código UNSPSC…"
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCriterios((c) => ({ ...c, unspsc: e.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-1.5">Publicación</Label>
                <ItcDateRangePicker
                  value={
                    criterios.publicadoDesde || criterios.publicadoHasta
                      ? {
                          from: fromIsoDate(criterios.publicadoDesde),
                          to: fromIsoDate(criterios.publicadoHasta),
                        }
                      : undefined
                  }
                  onChange={(range: DateRange | undefined) => {
                    setCriterios((c) => ({
                      ...c,
                      publicadoDesde: toIsoDate(range?.from),
                      publicadoHasta: toIsoDate(range?.to),
                    }));
                  }}
                />
              </div>

              <div>
                <Label className="mb-1.5">Cuantía mínima</Label>
                <ItcInput
                  type="number"
                  value={criterios.cuantiaMin}
                  placeholder="$0"
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCriterios((c) => ({ ...c, cuantiaMin: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="mb-1.5">Cuantía máxima</Label>
                <ItcInput
                  type="number"
                  value={criterios.cuantiaMax}
                  placeholder="Sin límite"
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCriterios((c) => ({ ...c, cuantiaMax: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-end">
                <ItcButton
                  type="button"
                  variant="secondary"
                  onClick={limpiarFiltros}
                  className="w-full"
                >
                  Limpiar filtros
                </ItcButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!buscada ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Definí los criterios y presioná &quot;Buscar en SECOP&quot; para consultar en tiempo real.
          Cada búsqueda consulta directamente a la plataforma oficial, así que hay un límite de
          frecuencia por organización.
        </div>
      ) : rows && rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin resultados para estos criterios.
        </div>
      ) : (
        rows && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {rows.length} resultado{rows.length === 1 ? "" : "s"} en página {page}
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Filas</Label>
                <ItcInput
                  type="select"
                  className="w-20"
                  value={String(pageSize)}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    if (buscada) {
                      ejecutarBusqueda(1, newSize);
                    }
                  }}
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </ItcInput>
                {isPending && <Spinner className="size-3.5 text-muted-foreground" />}
              </div>
            </div>

            <ItcTable
              data={rows}
              columns={columns}
              rowKey={(r) => r.secopId}
              pagination={false}
              tableLayout="fixed"
              striped
              hoverable
              stickyHeader
            />
            <div className="flex items-center justify-between">
              <ItcButton
                type="button"
                variant="secondary"
                disabled={page <= 1 || isPending}
                onClick={() => ejecutarBusqueda(page - 1)}
              >
                Anterior
              </ItcButton>
              <span className="text-sm text-muted-foreground">Página {page}</span>
              <ItcButton
                type="button"
                variant="secondary"
                disabled={rows.length < pageSize || isPending}
                onClick={() => ejecutarBusqueda(page + 1)}
              >
                Siguiente
              </ItcButton>
            </div>
          </div>
        )
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
        disabled={isActionPending}
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
        disabled={isActionPending}
      />

      <DetalleProcesoModal
        proceso={
          detalleTarget && {
            titulo: detalleTarget.titulo,
            secopId: detalleTarget.secopId,
            dataset: datasetBuscado,
            entidad: detalleTarget.entidad,
            objeto: detalleTarget.objeto,
            modalidad: detalleTarget.modalidad,
            estado: detalleTarget.estado,
            fase: detalleTarget.fase,
            valor: detalleTarget.valor,
            fechaPublicacion: detalleTarget.fechaPublicacion,
            fechaCierre: detalleTarget.fechaCierre,
            url: detalleTarget.url,
          }
        }
        onClose={() => setDetalleTarget(null)}
      />

      {isPending && <LoadingOverlay />}
    </div>
  );
}
