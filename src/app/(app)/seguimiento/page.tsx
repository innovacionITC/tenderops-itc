import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listProcesosSecop } from "@/lib/secop";
import { SeguimientoView } from "./seguimiento-view";

export default async function SeguimientoPage() {
  await requireAuth();

  const procesos = await listProcesosSecop({ soloPromovidos: true });

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
