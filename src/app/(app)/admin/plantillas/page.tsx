import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listPlantillas } from "@/lib/plantillas";
import { PlantillasTable } from "./plantillas-table";

export default async function PlantillasPage() {
  const auth = await requireAuth(["administrador"]);
  const rows = await listPlantillas();

  return (
    <>
      <PageHeader
        title="Plantillas"
        description="Gestión de las plantillas del sistema."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <PlantillasTable rows={rows} userRole={auth.role} />
      </div>
    </>
  );
}
