import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listModalidadesAdmin } from "@/lib/parametrica";
import { ModalidadesTable } from "./modalidades-table";

export default async function ModalidadesPage() {
  await requireAuth(["administrador"]);
  const rows = await listModalidadesAdmin();

  return (
    <>
      <PageHeader
        title="Modalidades"
        description="Catálogo de modalidades de contratación usado por los filtros de Paramétrica."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <ModalidadesTable rows={rows} />
      </div>
    </>
  );
}
