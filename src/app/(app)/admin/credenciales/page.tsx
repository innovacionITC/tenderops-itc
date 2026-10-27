import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listCredentials } from "@/lib/credentials";
import { CredentialsTable } from "./credentials-table";

export default async function CredencialesPage() {
  await requireAuth(["administrador"]);
  const rows = await listCredentials();

  return (
    <>
      <PageHeader
        title="Credenciales de integración"
        description="Claves y parámetros usados por integraciones externas."
      />
      <div className="page-body">
        <CredentialsTable rows={rows} />
      </div>
    </>
  );
}
