import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listProcesosSeguimiento } from "@/lib/seguimiento";
import { listProcesosHistoricos } from "@/lib/seguimiento-historicos";
import { listProcesosLogrados } from "@/lib/seguimiento-logrados";
import { listUsuariosAsignables } from "@/lib/usuarios-asignables";
import { SeguimientoView } from "./seguimiento-view";
import { ProcesosHistoricosView } from "./procesos-historicos-view";
import { ProcesosLogradosView } from "./procesos-logrados-view";
import { SeguimientoTabsNav } from "./seguimiento-tabs-nav";
import { HistoricosErrorBanner } from "./historicos-error-banner";
import { LogradosErrorBanner } from "./logrados-error-banner";
import { parseVista } from "./vista";
import { clasificarHistoricoError, type HistoricoErrorTipo } from "@/lib/errors/historicos";
import { clasificarLogradoError, type LogradoErrorTipo } from "@/lib/errors/logrados";
import type { HistoricosFiltrosDisponibles } from "@/lib/seguimiento-historicos-shared";
import type { LogradosFiltrosDisponibles } from "@/lib/seguimiento-logrados-shared";
import type { Paginado } from "@/lib/secop-shared";
import type { ProcesoHistoricoRow } from "@/lib/seguimiento-historicos-shared";
import type { ProcesoLogradoRow } from "@/lib/seguimiento-logrados-shared";
import type { ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";

export default async function SeguimientoPage({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    numeroProceso?: string;
    entidad?: string;
    responsableUserId?: string;
    estadoFinal?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    valorAdjudicadoMin?: string;
    valorAdjudicadoMax?: string;
    palabraClave?: string;
    sortBy?: string;
    sortDir?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await requireAuth(["administrador", "director", "gestor"]);
  const params = await searchParams;
  const vista = parseVista(params.vista);

  const header = (
    <PageHeader
      title="Seguimiento"
      description="Procesos promovidos desde Consulta SECOP para seguimiento activo, histórico y logrado."
    />
  );

  if (vista === "historicos") {
    const numeroProceso = params.numeroProceso?.trim() || undefined;
    const entidad = params.entidad?.trim() || undefined;
    const responsableUserId = params.responsableUserId || undefined;
    const estadoFinal = params.estadoFinal || undefined;
    const fechaDesde = params.fechaDesde || undefined;
    const fechaHasta = params.fechaHasta || undefined;
    const palabraClave = params.palabraClave?.trim() || undefined;
    const sortBy = params.sortBy || undefined;
    const sortDir = params.sortDir || undefined;
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Number(params.pageSize) || 25;

    let resultado: {
      procesos: Paginado<ProcesoHistoricoRow>;
      filtrosDisponibles: HistoricosFiltrosDisponibles;
    } | null = null;
    let errorTipo: HistoricoErrorTipo | null = null;

    try {
      const [procesos, responsables] = await Promise.all([
        listProcesosHistoricos({
          numeroProceso,
          entidad,
          responsableUserId,
          estadoFinal,
          fechaDesde,
          fechaHasta,
          palabraClave,
          sortBy,
          sortDir,
          page,
          pageSize,
        }),
        listUsuariosAsignables(),
      ]);

      resultado = {
        procesos,
        filtrosDisponibles: {
          responsables: responsables.map((r) => ({ id: r.id, name: r.name })),
        },
      };
    } catch (e) {
      errorTipo = clasificarHistoricoError(e);
    }

    return (
      <>
        {header}
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <SeguimientoTabsNav vista={vista} />
          {errorTipo || !resultado ? (
            <HistoricosErrorBanner tipo={errorTipo ?? "error_consulta"} />
          ) : (
            <ProcesosHistoricosView
              procesos={resultado.procesos}
              filtros={{
                numeroProceso: numeroProceso ?? "",
                entidad: entidad ?? "",
                responsableUserId: responsableUserId ?? "",
                estadoFinal: estadoFinal ?? "",
                fechaDesde: fechaDesde ?? "",
                fechaHasta: fechaHasta ?? "",
                palabraClave: palabraClave ?? "",
                sortBy: sortBy ?? "fechaCierre",
                sortDir: sortDir ?? "desc",
                pageSize,
              }}
              filtrosDisponibles={resultado.filtrosDisponibles}
            />
          )}
        </div>
      </>
    );
  }

  if (vista === "logrados") {
    const numeroProceso = params.numeroProceso?.trim() || undefined;
    const entidad = params.entidad?.trim() || undefined;
    const responsableUserId = params.responsableUserId || undefined;
    const fechaDesde = params.fechaDesde || undefined;
    const fechaHasta = params.fechaHasta || undefined;
    const valorAdjudicadoMin = params.valorAdjudicadoMin ? Number(params.valorAdjudicadoMin) : undefined;
    const valorAdjudicadoMax = params.valorAdjudicadoMax ? Number(params.valorAdjudicadoMax) : undefined;
    const palabraClave = params.palabraClave?.trim() || undefined;
    const sortBy = params.sortBy || undefined;
    const sortDir = params.sortDir || undefined;
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Number(params.pageSize) || 25;

    let resultado: {
      procesos: Paginado<ProcesoLogradoRow>;
      filtrosDisponibles: LogradosFiltrosDisponibles;
    } | null = null;
    let errorTipo: LogradoErrorTipo | null = null;

    try {
      const [procesos, responsables] = await Promise.all([
        listProcesosLogrados({
          numeroProceso,
          entidad,
          responsableUserId,
          fechaDesde,
          fechaHasta,
          valorAdjudicadoMin,
          valorAdjudicadoMax,
          palabraClave,
          sortBy,
          sortDir,
          page,
          pageSize,
        }),
        listUsuariosAsignables(),
      ]);

      resultado = {
        procesos,
        filtrosDisponibles: {
          responsables: responsables.map((r) => ({ id: r.id, name: r.name })),
        },
      };
    } catch (e) {
      errorTipo = clasificarLogradoError(e);
    }

    return (
      <>
        {header}
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <SeguimientoTabsNav vista={vista} />
          {errorTipo || !resultado ? (
            <LogradosErrorBanner tipo={errorTipo ?? "error_consulta"} />
          ) : (
            <ProcesosLogradosView
              procesos={resultado.procesos}
              filtros={{
                numeroProceso: numeroProceso ?? "",
                entidad: entidad ?? "",
                responsableUserId: responsableUserId ?? "",
                fechaDesde: fechaDesde ?? "",
                fechaHasta: fechaHasta ?? "",
                valorAdjudicadoMin: params.valorAdjudicadoMin ?? "",
                valorAdjudicadoMax: params.valorAdjudicadoMax ?? "",
                palabraClave: palabraClave ?? "",
                sortBy: sortBy ?? "fechaAdjudicacion",
                sortDir: sortDir ?? "desc",
                pageSize,
              }}
              filtrosDisponibles={resultado.filtrosDisponibles}
            />
          )}
        </div>
      </>
    );
  }

  const procesos: ProcesoSeguimientoRow[] = await listProcesosSeguimiento();
  const activos = procesos.filter((p) => p.estado !== "cerrado");

  return (
    <>
      {header}
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <SeguimientoTabsNav vista={vista} />
        <SeguimientoView procesos={activos} />
      </div>
    </>
  );
}
