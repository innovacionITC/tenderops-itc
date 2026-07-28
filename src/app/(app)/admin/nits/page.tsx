import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listNitsAdmin } from "@/lib/parametrica";
import { NitsTable } from "./nits-table";

export default async function NitsPage() {
  await requireAuth(["administrador"]);
  const rows = await listNitsAdmin();

  return (
    <>
      <PageHeader
        title="NITs"
        description="Catálogo de NITs usado por los filtros de Paramétrica."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <NitsTable rows={rows} />
      </div>
    </>
  );
}
