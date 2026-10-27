import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listOrganizaciones } from "@/lib/organizaciones";
import { OrganizacionesTable } from "./organizaciones-table";

export default async function OrganizacionesPage() {
  const auth = await requireAuth(["superadmin"]);
  const rows = await listOrganizaciones();

  return (
    <>
      <PageHeader
        title="Organizaciones"
        description="Gestión de las organizaciones del sistema. Solo Super Admin puede crear nuevas organizaciones."
      />
      <div className="page-body">
        <OrganizacionesTable rows={rows} userRole={auth.role} />
      </div>
    </>
  );
}
