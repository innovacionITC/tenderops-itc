import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listProcesosSeguimiento } from "@/lib/seguimiento";
import { SeguimientoView } from "./seguimiento-view";

export default async function SeguimientoPage() {
  await requireAuth(["administrador", "director", "gestor"]);

  const procesos = await listProcesosSeguimiento();

  return (
    <>
      <PageHeader
        title="Procesos en seguimiento"
        description="Procesos promovidos desde Consulta SECOP para seguimiento activo."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <SeguimientoView procesos={procesos} />
      </div>
    </>
  );
}
