import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listUnspscCodes } from "@/lib/unspsc";
import { UnspscTable } from "./unspsc-table";

export default async function UnspscPage() {
  await requireAuth(["administrador"]);
  const rows = await listUnspscCodes();

  return (
    <>
      <PageHeader
        title="Códigos UNSPSC"
        description="Catálogo usado por los filtros de búsqueda paramétrica."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <UnspscTable rows={rows} />
      </div>
    </>
  );
}
