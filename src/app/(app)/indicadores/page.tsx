import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listIndicadores } from "@/lib/indicadores";
import { listSuborganizacionesAdmin, type SuborganizacionRow } from "@/lib/parametrica";
import { IndicadoresView } from "./indicadores-view";
import { IndicadoresErrorBanner } from "./indicadores-error-banner";

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  const auth = await requireAuth(["administrador", "director", "gestor", "consultor"]);
  const params = await searchParams;
  const anioActual = new Date().getFullYear();
  const aniosPermitidos = [anioActual, anioActual - 1, anioActual - 2];
  const anioParam = Number(params.anio);
  const anio = aniosPermitidos.includes(anioParam) ? anioParam : anioActual;

  let resultado: {
    indicadores: Awaited<ReturnType<typeof listIndicadores>>["indicadores"];
    suborganizaciones: Awaited<ReturnType<typeof listIndicadores>>["suborganizaciones"];
    suborganizacionesAdmin: SuborganizacionRow[];
  } | null = null;
  let error = false;

  try {
    const [consulta, suborganizacionesAdmin] = await Promise.all([
      listIndicadores(anio),
      listSuborganizacionesAdmin(),
    ]);
    resultado = {
      indicadores: consulta.indicadores,
      suborganizaciones: consulta.suborganizaciones,
      suborganizacionesAdmin,
    };
  } catch {
    error = true;
  }

  return (
    <>
      <PageHeader
        title="Indicadores financieros"
        description="Consulta y gestión de indicadores financieros por organización y suborganización."
      />
      <div className="page-body space-y-3">
        {error || !resultado ? (
          <IndicadoresErrorBanner />
        ) : (
          <IndicadoresView
            indicadores={resultado.indicadores}
            suborganizaciones={resultado.suborganizaciones}
            suborganizacionesAdmin={resultado.suborganizacionesAdmin}
            anio={anio}
            userRole={auth.role}
            organizationId={auth.activeOrganizationId}
            organizationName={auth.activeOrganizationName}
          />
        )}
      </div>
    </>
  );
}
