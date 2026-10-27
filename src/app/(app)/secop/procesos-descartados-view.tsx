"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Search, Info, RotateCcw } from "lucide-react";
import {
  ItcTable,
  type TableColumn,
  ItcButton,
  ItcInput,
  ItcModal,
} from "@/components/itc";
import { DetalleProcesoModal } from "./detalle-proceso-modal";
import { Label } from "@/components/ui/label";
import {
  EntityCell,
  MoneyCell,
  ProcessTitleCell,
  SecondaryCell,
} from "@/components/layout/process-cells";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/layout/status-badge";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { RowActionButton } from "@/components/layout/row-action-button";
import { FiltrosPanel, type CampoFiltro, type ValoresFiltro } from "@/components/layout/filtros-panel";
import { formatFechaCorta } from "@/lib/format";
import type { Paginado, ProcesoRow, SecopFiltros } from "@/lib/secop-shared";
import { retomarProceso } from "./actions";

const PAGE_SIZES = [10, 25, 50, 100] as const;

type FiltrosState = {
  dataset: string;
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

// Misma consulta y filtros que "Procesos detectados" (ver page.tsx), pero
// sobre los procesos descartados y con la acción de retomarlos.
export function ProcesosDescartadosView({
  procesos,
  filtros,
  filtrosDisponibles,
  entidadesDisponibles,
}: {
  procesos: Paginado<ProcesoRow>;
  filtros: FiltrosState;
  filtrosDisponibles: SecopFiltros;
  entidadesDisponibles: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isBuscando, startBuscar] = useTransition();
  const [isRetomando, startRetomar] = useTransition();
  const [buscar, setBuscar] = useState(filtros.buscar);
  const [retomarTarget, setRetomarTarget] = useState<ProcesoRow | null>(null);
  const [detalleTarget, setDetalleTarget] = useState<ProcesoRow | null>(null);

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
      etiqueta: "Estado SECOP",
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
    entidad: filtros.entidad,
    modalidad: filtros.modalidad,
    estado: filtros.estado,
    fase: filtros.fase,
    objeto: filtros.objeto,
    cuantiaMin: filtros.cuantiaMin,
    cuantiaMax: filtros.cuantiaMax,
    detectadoDesde: filtros.detectadoDesde,
    detectadoHasta: filtros.detectadoHasta,
  };

  const aplicarFiltros = (v: ValoresFiltro) =>
    aplicar({
      dataset: v.dataset,
      entidad: v.entidad,
      modalidad: v.modalidad,
      estado: v.estado,
      fase: v.fase,
      objeto: v.objeto,
      cuantiaMin: v.cuantiaMin,
      cuantiaMax: v.cuantiaMax,
      detectadoDesde: v.detectadoDesde,
      detectadoHasta: v.detectadoHasta,
    });

  const aplicar = (cambios: Partial<FiltrosState & { page: number }>) => {
    const next = {
      dataset: cambios.dataset ?? filtros.dataset,
      buscar: cambios.buscar ?? buscar,
      entidad: cambios.entidad ?? filtros.entidad,
      objeto: cambios.objeto ?? filtros.objeto,
      modalidad: cambios.modalidad ?? filtros.modalidad,
      estado: cambios.estado ?? filtros.estado,
      fase: cambios.fase ?? filtros.fase,
      cuantiaMin: cambios.cuantiaMin ?? filtros.cuantiaMin,
      cuantiaMax: cambios.cuantiaMax ?? filtros.cuantiaMax,
      detectadoDesde: cambios.detectadoDesde ?? filtros.detectadoDesde,
      detectadoHasta: cambios.detectadoHasta ?? filtros.detectadoHasta,
      pageSize: cambios.pageSize ?? filtros.pageSize,
      page: cambios.page ?? 1,
    };

    const qs = new URLSearchParams();
    qs.set("vista", "descartados");
    if (next.dataset) qs.set("dataset", next.dataset);
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
      router.push(`${pathname}?${qs}`);
    });
  };

  const limpiarFiltros = () => {
    setBuscar("");
    startBuscar(() => {
      router.push(`${pathname}?vista=descartados`);
    });
  };

  const handleRetomar = () => {
    if (!retomarTarget) return;
    const id = retomarTarget.id;
    startRetomar(async () => {
      try {
        await retomarProceso(id);
        toast.success("Proceso retomado", {
          description: "Volvió a \"Procesos detectados\" para continuar con su análisis.",
        });
        setRetomarTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo retomar el proceso");
      }
    });
  };

  const columns: TableColumn<ProcesoRow>[] = [
    {
      key: "secopId",
      title: "N° proceso",
      width: "11%",
      render: (r) => (
        <span className="block truncate font-mono text-sm" title={r.secopId}>
          {r.secopId}
        </span>
      ),
    },
    {
      key: "entidad",
      title: "Entidad",
      width: "15%",
      render: (r) => <EntityCell name={r.entidad} starred={r.entidadRegistrada} />,
    },
    {
      key: "objeto",
      title: "Objeto",
      width: "17%",
      render: (r) => <ProcessTitleCell title={r.objeto} />,
    },
    {
      key: "modalidad",
      title: "Modalidad",
      width: "11%",
      render: (r) => <SecondaryCell title={r.modalidad ?? undefined}>{r.modalidad ?? "—"}</SecondaryCell>,
    },
    {
      key: "estado",
      title: "Estado",
      width: "9%",
      align: "center",
      render: () => <StatusBadge tone="muted">Descartado</StatusBadge>,
    },
    {
      key: "motivoDescarte",
      title: "Motivo del descarte",
      width: "13%",
      render: (r) => (
        <span className="block truncate text-sm text-muted-foreground" title={r.motivoDescarte ?? undefined}>
          {r.motivoDescarte ?? "—"}
        </span>
      ),
    },
    {
      key: "valor",
      title: "Cuantía",
      width: "10%",
      align: "right",
      render: (r) => <MoneyCell value={r.valor} />,
    },
    {
      key: "descartadoEl",
      title: "Descartado",
      width: "9%",
      render: (r) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {r.descartadoEl ? formatFechaCorta(r.descartadoEl) : "—"}
        </span>
      ),
    },
    {
      key: "acciones",
      title: "Acciones",
      width: 120,
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
          <RowActionButton
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            title="Retomar proceso"
            onClick={() => setRetomarTarget(r)}
            disabled={isRetomando}
          />
        </div>
      ),
    },
  ];

  const totalPaginas = Math.max(Math.ceil(procesos.total / procesos.pageSize), 1);

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
              : `${procesos.total} proceso${procesos.total === 1 ? "" : "s"} descartado${procesos.total === 1 ? "" : "s"}`}
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
            No hay procesos descartados. Los que descartes desde &quot;Procesos detectados&quot; o &quot;Búsqueda en
            vivo&quot; aparecerán aquí.
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
                ariaLabel="Tabla de procesos descartados"
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
        open={retomarTarget !== null}
        onClose={() => setRetomarTarget(null)}
        onConfirm={handleRetomar}
        title="¿Retomar proceso?"
        content={
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              El proceso{" "}
              <span className="font-medium text-foreground">{retomarTarget?.secopId}</span>{" "}
              volverá a &quot;Procesos detectados&quot; en Consulta SECOP y podrás continuar con su análisis.
            </p>
            <p>
              Motivo del descarte:{" "}
              <span className="text-foreground">
                {retomarTarget?.motivoDescarte ?? "Sin motivo registrado"}
              </span>
            </p>
            <p>Se conserva el historial anterior y queda registrado quién lo retomó y cuándo.</p>
          </div>
        }
        variant="confirm"
        confirmText="Retomar"
        disabled={isRetomando}
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
            descartado: true,
            descartadoEl: detalleTarget.descartadoEl,
            motivoDescarte: detalleTarget.motivoDescarte,
          }
        }
        onClose={() => setDetalleTarget(null)}
      />

      {isBuscando && <LoadingOverlay />}
    </div>
  );
}
