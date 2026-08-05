import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { canAdmin } from "@/lib/auth/roles";
import {
  listProcesosSecop,
  listSincronizacionesSecop,
  getSecopFiltros,
} from "@/lib/secop";
import { DATASETS } from "@/lib/secop-shared";
import { ProcesosSecopView } from "./procesos-secop-view";
import { BusquedaEnVivoView } from "./busqueda-en-vivo-view";
import { SecopTabsNav } from "./secop-tabs-nav";
import { parseVista } from "./vista";

export default async function SecopPage({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    dataset?: string;
    nuevos?: string;
    buscar?: string;
    entidad?: string;
    objeto?: string;
    modalidad?: string;
    estado?: string;
    fase?: string;
    cuantiaMin?: string;
    cuantiaMax?: string;
    detectadoDesde?: string;
    detectadoHasta?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const auth = await requireAuth();
  const params = await searchParams;
  const vista = parseVista(params.vista);
  const esAdmin = canAdmin(auth.role);

  const header = (
    <PageHeader
      title="Consulta SECOP"
      description="Búsqueda en tiempo real, seguimiento global y monitoreo diario de entidades."
    />
  );

  if (vista === "vivo") {
    return (
      <>
        {header}
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <SecopTabsNav vista={vista} />
          <BusquedaEnVivoView />
        </div>
      </>
    );
  }

  const dataset = DATASETS.find((d) => d === params.dataset);
  const soloNuevos = params.nuevos === "1";
  const buscar = params.buscar?.trim() || undefined;
  const entidad = params.entidad?.trim() || undefined;
  const objeto = params.objeto?.trim() || undefined;
  const modalidad = params.modalidad || undefined;
  const estado = params.estado || undefined;
  const fase = params.fase || undefined;
  const cuantiaMin = params.cuantiaMin ? Number(params.cuantiaMin) : undefined;
  const cuantiaMax = params.cuantiaMax ? Number(params.cuantiaMax) : undefined;
  const detectadoDesde = params.detectadoDesde || undefined;
  const detectadoHasta = params.detectadoHasta || undefined;
  const page = Math.max(Number(params.page) || 1, 1);
  const pageSize = Number(params.pageSize) || 25;

  // La obtención de datos vive fuera del JSX a propósito: React no ejecuta el
  // render de forma síncrona, así que un try/catch envolviendo el `return
  // (<JSX/>)` no captura nada útil (regla react-hooks/error-boundaries). Acá
  // el try solo cubre el await; el JSX de abajo se construye siempre, y solo
  // decide qué mostrar según `error`.
  let resultado: {
    procesos: Awaited<ReturnType<typeof listProcesosSecop>>;
    sincronizaciones: Awaited<ReturnType<typeof listSincronizacionesSecop>>;
    filtrosDisponibles: Awaited<ReturnType<typeof getSecopFiltros>>;
  } | null = null;
  let error: string | null = null;

  try {
    const [procesos, sincronizaciones, filtrosDisponibles] = await Promise.all([
      listProcesosSecop({
        dataset,
        soloNuevos,
        buscar,
        entidad,
        objeto,
        modalidad,
        estado,
        fase,
        cuantiaMin,
        cuantiaMax,
        detectadoDesde,
        detectadoHasta,
        entidadesMonitoreadas: vista === "monitoreadas" ? true : undefined,
        page,
        pageSize,
      }),
      esAdmin && vista === "detectados" ? listSincronizacionesSecop() : Promise.resolve([]),
      getSecopFiltros(),
    ]);
    resultado = { procesos, sincronizaciones, filtrosDisponibles };
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar los procesos detectados.";
  }

  return (
    <>
      {header}
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <SecopTabsNav vista={vista} />
        {error || !resultado ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error ?? "Error al cargar los procesos detectados."}
          </div>
        ) : (
          <ProcesosSecopView
            vista={vista}
            procesos={resultado.procesos}
            sincronizaciones={resultado.sincronizaciones}
            filtros={{
              dataset: dataset ?? "",
              soloNuevos,
              buscar: buscar ?? "",
              entidad: entidad ?? "",
              objeto: objeto ?? "",
              modalidad: modalidad ?? "",
              estado: estado ?? "",
              fase: fase ?? "",
              cuantiaMin: params.cuantiaMin ?? "",
              cuantiaMax: params.cuantiaMax ?? "",
              detectadoDesde: detectadoDesde ?? "",
              detectadoHasta: detectadoHasta ?? "",
              pageSize,
            }}
            filtrosDisponibles={resultado.filtrosDisponibles}
            esAdmin={esAdmin}
          />
        )}
      </div>
    </>
  );
}
