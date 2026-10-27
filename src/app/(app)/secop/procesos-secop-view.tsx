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
  RotateCcw,
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
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/layout/status-badge";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { RowActionButton } from "@/components/layout/row-action-button";
import { FiltrosPanel, type CampoFiltro, type ValoresFiltro } from "@/components/layout/filtros-panel";
import {
  MoneyCell,
  ProcessIdentityCell,
  SecondaryCell,
  SemaforoMeter,
  StageCell,
} from "@/components/layout/process-cells";
import { formatFechaCorta } from "@/lib/format";
import {
  SEMAFOROS,
  datasetLabels,
  semaforoLabels,
  type Paginado,
  type ProcesoRow,
  type SecopFiltros,
} from "@/lib/secop-shared";
import { sincronizarSecop, promoverProceso, descartarProceso, reintentarSemaforo } from "./actions";

const PAGE_SIZES = [10, 25, 50, 100] as const;

type FiltrosState = {
  dataset: string;
  soloNuevos: boolean;
  buscar: string;
  entidad: string;
  objeto: string;
  modalidad: string;
  estado: string;
  fase: string;
  semaforo: string;
  cuantiaMin: string;
  cuantiaMax: string;
  detectadoDesde: string;
  detectadoHasta: string;
  pageSize: number;
};

export function ProcesosSecopView({
  procesos,
  filtros,
  filtrosDisponibles,
  entidadesDisponibles,
  esAdmin,
}: {
  procesos: Paginado<ProcesoRow>;
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
  const [promoverTarget, setPromoverTarget] = useState<ProcesoRow | null>(null);
  const [descartarTarget, setDescartarTarget] = useState<ProcesoRow | null>(null);
  const [descartarMotivo, setDescartarMotivo] = useState("");
  const [detalleTarget, setDetalleTarget] = useState<ProcesoRow | null>(null);
  const [reintentandoId, setReintentandoId] = useState<string | null>(null);

  const campos: CampoFiltro[] = [
    {
      tipo: "select",
      clave: "dataset",
      etiqueta: "Fuente",
      seccion: "Contratación",
      placeholderTodos: "Todas",
      opciones: [
        { value: "secop_i", label: "SECOP I" },
        { value: "secop_ii", label: "SECOP II" },
      ],
    },
    { tipo: "switch", clave: "soloNuevos", etiqueta: "Solo nuevos", seccion: "Contratación" },
    {
      tipo: "seleccion-libre",
      clave: "entidad",
      etiqueta: "Entidad",
      seccion: "Contratación",
      opciones: entidadesDisponibles,
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
      tipo: "seleccion-libre",
      clave: "estado",
      etiqueta: "Estado",
      seccion: "Contratación",
      opciones: filtrosDisponibles.estados,
      placeholderTodos: "Todos",
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
      tipo: "select",
      clave: "semaforo",
      etiqueta: "Semáforo",
      seccion: "Contratación",
      placeholderTodos: "Todos",
      opciones: SEMAFOROS.map((s) => ({ value: s, label: semaforoLabels[s] })),
    },
    {
      tipo: "texto",
      clave: "objeto",
      etiqueta: "Objeto",
      seccion: "Contratación",
      placeholder: "Filtrar por objeto…",
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
  ];

  const valoresFiltro: ValoresFiltro = {
    dataset: filtros.dataset,
    soloNuevos: filtros.soloNuevos ? "1" : "",
    entidad: filtros.entidad,
    modalidad: filtros.modalidad,
    estado: filtros.estado,
    fase: filtros.fase,
    semaforo: filtros.semaforo,
    objeto: filtros.objeto,
    cuantiaMin: filtros.cuantiaMin,
    cuantiaMax: filtros.cuantiaMax,
    detectadoDesde: filtros.detectadoDesde,
    detectadoHasta: filtros.detectadoHasta,
  };

  const aplicarFiltros = (v: ValoresFiltro) =>
    aplicar({
      dataset: v.dataset,
      soloNuevos: v.soloNuevos === "1",
      entidad: v.entidad,
      modalidad: v.modalidad,
      estado: v.estado,
      fase: v.fase,
      semaforo: v.semaforo,
      objeto: v.objeto,
      cuantiaMin: v.cuantiaMin,
      cuantiaMax: v.cuantiaMax,
      detectadoDesde: v.detectadoDesde,
      detectadoHasta: v.detectadoHasta,
    });

  const aplicar = (
    cambios: Partial<FiltrosState & { page: number }>,
  ) => {
    const next = {
      dataset: cambios.dataset ?? filtros.dataset,
      nuevos: cambios.soloNuevos ?? filtros.soloNuevos,
      buscar: cambios.buscar ?? buscar,
      entidad: cambios.entidad ?? filtros.entidad,
      objeto: cambios.objeto ?? filtros.objeto,
      modalidad: cambios.modalidad ?? filtros.modalidad,
      estado: cambios.estado ?? filtros.estado,
      fase: cambios.fase ?? filtros.fase,
      semaforo: cambios.semaforo ?? filtros.semaforo,
      cuantiaMin: cambios.cuantiaMin ?? filtros.cuantiaMin,
      cuantiaMax: cambios.cuantiaMax ?? filtros.cuantiaMax,
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
    if (next.semaforo) qs.set("semaforo", next.semaforo);
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

  const limpiarFiltros = () => {
    setBuscar("");
    startBuscar(() => {
      router.push(pathname);
    });
  };

  const handleSincronizar = () => {
    startSync(async () => {
      try {
        await sincronizarSecop();
        toast.success("Sincronización iniciada", {
          description:
            "El proceso corre en segundo plano y puede tardar unos minutos. Revisa la pestaña 'Sincronizaciones' para ver el resultado.",
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

  const handleReintentarSemaforo = (id: string) => {
    setReintentandoId(id);
    startTransition(async () => {
      try {
        await reintentarSemaforo(id);
        toast.success("Reintento de clasificación encolado");
        setReintentandoId(null);
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo reintentar la clasificación",
        );
        setReintentandoId(null);
      }
    });
  };

  // tableLayout="fixed" + un ancho por columna: así el texto largo trunca con
  // "…" (ver className="truncate") en vez de ensanchar la tabla y forzar
  // scroll horizontal. "Proceso" (título) y "Fuente" no son columnas propias
  // del requerimiento de negocio; quedan disponibles en el modal de detalle.
  const columns: TableColumn<ProcesoRow>[] = [
    {
      key: "semaforo",
      title: "Semáforo",
      width: "11%",
      render: (r) => (
        <SemaforoMeter
          semaforo={r.semaforo}
          semaforoScore={r.semaforoScore}
          semaforoEstado={r.semaforoEstado}
        />
      ),
    },
    {
      key: "proceso",
      title: "Proceso",
      width: "34%",
      render: (r) => (
        <ProcessIdentityCell
          identifier={r.secopId}
          source={datasetLabels[r.dataset] ?? r.dataset}
          title={r.objeto || r.titulo}
          entity={r.entidad}
          starred={r.entidadRegistrada}
        />
      ),
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
      width: "11%",
      render: (r) => (
        <div className="flex min-w-0 flex-col gap-1">
          <SecondaryCell title={r.estado ?? undefined}>{r.estado ?? "—"}</SecondaryCell>
          {r.esNuevo && <StatusBadge tone="info">Nuevo</StatusBadge>}
        </div>
      ),
    },
    {
      key: "fase",
      title: "Fase",
      width: "8%",
      render: (r) => <StageCell label={r.fase} />,
    },
    {
      key: "valor",
      title: "Cuantía",
      width: "10%",
      render: (r) => <MoneyCell value={r.valor} />,
    },
    {
      key: "detectadoEl",
      title: "Detectado",
      width: "9%",
      render: (r) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatFechaCorta(r.detectadoEl)}
        </span>
      ),
    },
    {
      key: "acciones",
      title: "Acciones",
      width: 168,
      align: "right",
      render: (r) => (
        <div className="flex flex-nowrap justify-end gap-0.5 whitespace-nowrap">
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
          {/* Un proceso ya promovido se descarta desde "Procesos en
              seguimiento"; aquí solo se descarta lo que aún no tiene seguimiento. */}
          {!r.descartado && !r.promovido && (
            <RowActionButton
              icon={<XCircle className="h-3.5 w-3.5" />}
              title="Descartar proceso"
              onClick={() => setDescartarTarget(r)}
            />
          )}
          {r.semaforoEstado === "error" && (
            <RowActionButton
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              title="Reintentar clasificación"
              onClick={() => handleReintentarSemaforo(r.id)}
              disabled={reintentandoId === r.id}
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
    <div className="space-y-3">
      <FiltrosPanel
        campos={campos}
        valores={valoresFiltro}
        onAplicar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        deshabilitado={isBuscando}
        acciones={
          esAdmin ? (
            <ItcButton onClick={handleSincronizar} disabled={isSyncing} className="h-8 px-2.5 text-xs">
              {isSyncing ? <Spinner className="size-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {isSyncing ? "Encolando…" : "Sincronizar"}
            </ItcButton>
          ) : undefined
        }
        buscador={
          <div className="flex gap-1.5">
            <ItcInput
              value={buscar}
              placeholder="Título, entidad u objeto…"
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
            <div className="process-table">
              <ItcTable
                data={procesos.items}
                columns={columns}
                rowKey={(r) => r.id}
                pagination={false}
                tableLayout="fixed"
                hoverable
                stickyHeader
              />
            </div>

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
              pasará a la pestaña &quot;Descartados&quot;, desde donde podrás retomarlo.
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
            semaforo: detalleTarget.semaforo,
            semaforoScore: detalleTarget.semaforoScore,
            semaforoJustificacion: detalleTarget.semaforoJustificacion,
            semaforoEstado: detalleTarget.semaforoEstado,
            semaforoError: detalleTarget.semaforoError,
          }
        }
        onClose={() => setDetalleTarget(null)}
      />

      {isBuscando && <LoadingOverlay />}
    </div>
  );
}
