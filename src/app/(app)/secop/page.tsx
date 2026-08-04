import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { canAdmin } from "@/lib/auth/roles";
import { listProcesosSecop, listSincronizacionesSecop } from "@/lib/secop";
import { DATASETS } from "@/lib/secop-shared";
import { ProcesosSecopView } from "./procesos-secop-view";

export default async function SecopPage({
  searchParams,
}: {
  searchParams: Promise<{
    dataset?: string;
    nuevos?: string;
    buscar?: string;
    page?: string;
  }>;
}) {
  const auth = await requireAuth();
  const params = await searchParams;

  // El backend ya ignora un dataset desconocido, pero normalizar acá evita
  // mandar basura en la query y mantiene los controles de la UI coherentes.
  const dataset = DATASETS.find((d) => d === params.dataset);
  const soloNuevos = params.nuevos === "1";
  const buscar = params.buscar?.trim() || undefined;
  const page = Math.max(Number(params.page) || 1, 1);

  const esAdmin = canAdmin(auth.role);

  // El historial de corridas exige CanAdmin en la API; pedirlo con un rol menor
  // devolvería 403 y tumbaría el render de toda la página.
  const [procesos, sincronizaciones] = await Promise.all([
    listProcesosSecop({ dataset, soloNuevos, buscar, page }),
    esAdmin ? listSincronizacionesSecop() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Consulta SECOP"
        description="Procesos detectados en SECOP I y II según la paramétrica de búsqueda de tu organización."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <ProcesosSecopView
          procesos={procesos}
          sincronizaciones={sincronizaciones}
          filtros={{ dataset: dataset ?? "", soloNuevos, buscar: buscar ?? "" }}
          esAdmin={esAdmin}
        />
      </div>
    </>
  );
}
