import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listEntidadesAdmin } from "@/lib/parametrica";
import { EntidadesTable } from "./entidades-table";

export default async function EntidadesPage() {
  await requireAuth(["administrador"]);
  const rows = await listEntidadesAdmin();

  return (
    <>
      <PageHeader
        title="Entidades"
        description="Catálogo de entidades contratantes usado por los filtros de Paramétrica."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <EntidadesTable rows={rows} />
      </div>
    </>
  );
}
