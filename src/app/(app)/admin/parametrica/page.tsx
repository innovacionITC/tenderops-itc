import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { getParametricaConfig, listEntidades, listEstadosSecop, listModalidades } from "@/lib/parametrica";
import { listUnspscCodes } from "@/lib/unspsc";
import { ParametricaForm } from "./parametrica-form";

export default async function ParametricaPage() {
  await requireAuth(["administrador"]);

  const [config, modalidades, entidades, estadosSecop, unspscCodes] = await Promise.all([
    getParametricaConfig(),
    listModalidades(),
    listEntidades(),
    listEstadosSecop(),
    listUnspscCodes(),
  ]);

  return (
    <>
      <PageHeader
        title="Paramétrica"
        description="Configuración global de la búsqueda automática de procesos en SECOP."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <ParametricaForm
          config={config}
          catalogs={{ modalidades, entidades, estadosSecop, unspscCodes }}
        />
      </div>
    </>
  );
}
