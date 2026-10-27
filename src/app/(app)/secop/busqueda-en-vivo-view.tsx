"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Search,
  Info,
  Eye,
  XCircle,
} from "lucide-react";
import {
  ItcTable,
  type TableColumn,
  ItcButton,
  ItcInput,
  ItcModal,
} from "@/components/itc";
import { DetalleProcesoModal } from "./detalle-proceso-modal";
import { Label } from "@/components/ui/label";
import { MoneyCell, ProcessTitleCell, SecondaryCell, StageCell } from "@/components/layout/process-cells";
import { Spinner } from "@/components/ui/spinner";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { RowActionButton } from "@/components/layout/row-action-button";
import { FiltrosPanel, type CampoFiltro, type ValoresFiltro } from "@/components/layout/filtros-panel";
import { formatDate } from "@/lib/format";
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
  const [detalleTarget, setDetalleTarget] = useState<BuscarEnVivoRow | null>(null);
  const [promoverTarget, setPromoverTarget] = useState<BuscarEnVivoRow | null>(null);
  const [descartarTarget, setDescartarTarget] = useState<BuscarEnVivoRow | null>(null);
  const [descartarMotivo, setDescartarMotivo] = useState("");
  const [promovidos, setPromovidos] = useState<Set<string>>(new Set());
  const [descartados, setDescartados] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  const ejecutarBusqueda = (
    paginaDestino: number,
    tamañoDestino?: number,
    base: Criterios = criterios,
  ) => {
    const tamaño = tamañoDestino ?? pageSize;
    const datasetUsado = base.dataset;
    startTransition(async () => {
      try {
        const res = await buscarEnVivoAction({
          dataset: datasetUsado,
          keyword: base.keyword.trim() || undefined,
          entidad: base.entidad.trim() || undefined,
          nit: base.nit.trim() || undefined,
          numeroProceso: base.numeroProceso.trim() || undefined,
          objeto: base.objeto.trim() || undefined,
          modalidad: base.modalidad.trim() || undefined,
          estado: base.estado.trim() || undefined,
          departamento: base.departamento.trim() || undefined,
          ciudad: base.ciudad.trim() || undefined,
          unspsc: base.unspsc.trim() || undefined,
          publicadoDesde: base.publicadoDesde || undefined,
          publicadoHasta: base.publicadoHasta || undefined,
          cuantiaMin: base.cuantiaMin ? Number(base.cuantiaMin) : undefined,
          cuantiaMax: base.cuantiaMax ? Number(base.cuantiaMax) : undefined,
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

  const campos: CampoFiltro[] = [
    {
      tipo: "seleccion-libre",
      clave: "entidad",
      etiqueta: "Entidad",
      seccion: "Contratación",
      opciones: entidadesDisponibles,
      placeholderTodos: "Todas las entidades",
    },
    { tipo: "texto", clave: "nit", etiqueta: "NIT", seccion: "Contratación", placeholder: "Identificador exacto…" },
    {
      tipo: "texto",
      clave: "numeroProceso",
      etiqueta: "N. proceso",
      seccion: "Contratación",
      placeholder: "ID del proceso (exacto)…",
    },
    { tipo: "texto", clave: "objeto", etiqueta: "Objeto", seccion: "Contratación", placeholder: "Palabras del objeto…" },
    {
      tipo: "seleccion-libre",
      clave: "modalidad",
      etiqueta: "Modalidad",
      seccion: "Contratación",
      opciones: filtrosDisponibles.modalidades,
      placeholderTodos: "Todas las modalidades",
    },
    {
      tipo: "seleccion-libre",
      clave: "estado",
      etiqueta: "Estado",
      seccion: "Contratación",
      opciones: filtrosDisponibles.estados,
      placeholderTodos: "Todos los estados",
    },
    {
      tipo: "seleccion-libre",
      clave: "departamento",
      etiqueta: "Departamento",
      seccion: "Ubicación",
      opciones: departamentosDisponibles,
      placeholderTodos: "Todos los departamentos",
    },
    {
      tipo: "seleccion-libre",
      clave: "ciudad",
      etiqueta: "Ciudad",
      seccion: "Ubicación",
      opciones: ciudadesDisponibles,
      placeholderTodos: "Todas las ciudades",
    },
    { tipo: "texto", clave: "unspsc", etiqueta: "UNSPSC", seccion: "Contratación", placeholder: "Código UNSPSC…" },
    { tipo: "moneda", clave: "cuantiaMin", etiqueta: "Cuantía mínima", seccion: "Financiera", placeholder: "$0" },
    { tipo: "moneda", clave: "cuantiaMax", etiqueta: "Cuantía máxima", seccion: "Financiera", placeholder: "Sin límite" },
    {
      tipo: "fechas",
      claveDesde: "publicadoDesde",
      claveHasta: "publicadoHasta",
      etiqueta: "Publicación",
      seccion: "Fechas",
    },
  ];

  const valoresFiltro: ValoresFiltro = {
    entidad: criterios.entidad,
    nit: criterios.nit,
    numeroProceso: criterios.numeroProceso,
    objeto: criterios.objeto,
    modalidad: criterios.modalidad,
    estado: criterios.estado,
    departamento: criterios.departamento,
    ciudad: criterios.ciudad,
    unspsc: criterios.unspsc,
    cuantiaMin: criterios.cuantiaMin,
    cuantiaMax: criterios.cuantiaMax,
    publicadoDesde: criterios.publicadoDesde,
    publicadoHasta: criterios.publicadoHasta,
  };

  const fusionarFiltros = (v: ValoresFiltro): Criterios => ({
    ...criterios,
    entidad: v.entidad,
    nit: v.nit,
    numeroProceso: v.numeroProceso,
    objeto: v.objeto,
    modalidad: v.modalidad,
    estado: v.estado,
    departamento: v.departamento,
    ciudad: v.ciudad,
    unspsc: v.unspsc,
    cuantiaMin: v.cuantiaMin,
    cuantiaMax: v.cuantiaMax,
    publicadoDesde: v.publicadoDesde,
    publicadoHasta: v.publicadoHasta,
  });

  const columns: TableColumn<BuscarEnVivoRow>[] = [
    {
      key: "entidad",
      title: "Entidad",
      width: "18%",
      render: (r) => <SecondaryCell title={r.entidad ?? undefined}>{r.entidad ?? "—"}</SecondaryCell>,
    },
    {
      key: "secopId",
      title: "N. proceso",
      width: "10%",
      render: (r) => (
        <span className="block truncate font-mono text-xs text-muted-foreground" title={r.secopId}>
          {r.secopId}
        </span>
      ),
    },
    {
      key: "objeto",
      title: "Objeto",
      width: "22%",
      render: (r) => <ProcessTitleCell title={r.objeto} />,
    },
    {
      key: "modalidad",
      title: "Modalidad",
      width: "12%",
      render: (r) => <SecondaryCell title={r.modalidad ?? undefined}>{r.modalidad ?? "—"}</SecondaryCell>,
    },
    {
      key: "estado",
      title: "Estado",
      width: "10%",
      render: (r) => <StageCell label={r.estado} />,
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
      render: (r) => <MoneyCell value={r.valor} />,
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
    <div className="space-y-3">
      <FiltrosPanel
            campos={campos}
            valores={valoresFiltro}
            onAplicar={(v) => {
              const next = fusionarFiltros(v);
              setCriterios(next);
              ejecutarBusqueda(1, undefined, next);
            }}
            onQuitar={(v) => setCriterios(fusionarFiltros(v))}
            onLimpiar={limpiarFiltros}
            deshabilitado={isPending}
            descripcion="Define los criterios y busca directamente en SECOP."
            buscador={
              <div className="flex flex-wrap gap-1.5">
                <div className="min-w-52 flex-1">
                  <ItcInput
                    value={criterios.keyword}
                    placeholder="Palabras clave…"
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
                <ItcInput
                  type="select"
                  className="w-32"
                  value={criterios.dataset}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCriterios((c) => ({ ...c, dataset: e.target.value }))
                  }
                >
                  <option value="secop_i">SECOP I</option>
                  <option value="secop_ii">SECOP II</option>
                </ItcInput>
              </div>
            }
            acciones={
              <ItcButton
                type="button"
                className="h-8 px-2.5 text-xs"
                onClick={() => ejecutarBusqueda(1)}
                disabled={isPending}
              >
                {isPending ? <Spinner className="size-3.5" /> : <Search className="h-3.5 w-3.5" />}
                Buscar
              </ItcButton>
            }
          />

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

            <div className="process-table">
              <ItcTable
                data={rows}
                columns={columns}
                rowKey={(r) => r.secopId}
                pagination={false}
                tableLayout="fixed"
                hoverable
                stickyHeader
              />
            </div>
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
