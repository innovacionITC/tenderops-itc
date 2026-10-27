import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listPlantillas } from "@/lib/plantillas";
import { PlantillasTable } from "@/components/plantillas/plantillas-table";

export default async function PlantillasPage() {
  const auth = await requireAuth(["administrador"]);
  const rows = await listPlantillas();

  return (
    <>
      <PageHeader
        title="Plantillas"
        description="Gestión de las plantillas del sistema."
      />
      <div className="page-body">
        <PlantillasTable rows={rows} userRole={auth.role} variant="admin" />
      </div>
    </>
  );
}
