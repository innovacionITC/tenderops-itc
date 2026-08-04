import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listPlantillas } from "@/lib/plantillas";
import { PlantillasTable } from "@/components/plantillas/plantillas-table";

export default async function PlantillasPage() {
  const auth = await requireAuth();
  const rows = await listPlantillas();

  return (
    <>
      <PageHeader
        title="Plantillas"
        description="Consulta las plantillas disponibles de tu organización."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <PlantillasTable rows={rows} userRole={auth.role} variant="consulta" />
      </div>
    </>
  );
}
