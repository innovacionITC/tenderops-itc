import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listCiudadesAdmin, listDepartamentos } from "@/lib/parametrica";
import { CiudadesTable } from "./ciudades-table";

export default async function CiudadesPage() {
  await requireAuth(["administrador"]);

  const [rows, departamentos] = await Promise.all([listCiudadesAdmin(), listDepartamentos()]);

  return (
    <>
      <PageHeader title="Ciudades" description="Catálogo de ciudades y municipios" />
      <div className="p-4 sm:p-6 lg:p-8">
        <CiudadesTable rows={rows} departamentos={departamentos} />
      </div>
    </>
  );
}
