import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listDepartamentosAdmin } from "@/lib/parametrica";
import { DepartamentosTable } from "./departamentos-table";

export default async function DepartamentosPage() {
  await requireAuth(["administrador"]);
  const rows = await listDepartamentosAdmin();

  return (
    <>
      <PageHeader
        title="Departamentos"
        description="Catálogo de departamentos "
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <DepartamentosTable rows={rows} />
      </div>
    </>
  );
}
