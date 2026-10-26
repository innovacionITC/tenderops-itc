import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { getConocimientoLicitaciones } from "./actions";
import { ConocimientoLicitacionesView } from "./conocimiento-view";

export default async function ConocimientoLicitacionesPage() {
  await requireAuth(["superadmin", "administrador"]);
  const estado = await getConocimientoLicitaciones();

  return (
    <>
      <PageHeader
        title="Base de conocimiento de licitaciones"
        description="Datos de xRM e Intelecto (indicadores, experiencia y RUP) que usa el Análisis IA para evaluar cada pliego."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <ConocimientoLicitacionesView estado={estado} />
      </div>
    </>
  );
}
