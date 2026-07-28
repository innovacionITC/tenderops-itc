import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import {
  getParametricaConfig,
  listCiudadesByIds,
  listDepartamentos,
  listEntidades,
  listEstadosSecop,
  listModalidades,
  listNits,
} from "@/lib/parametrica";
import { listUnspscCodes } from "@/lib/unspsc";
import { ParametricaForm } from "./parametrica-form";

export default async function ParametricaPage() {
  await requireAuth(["administrador"]);

  const [config, modalidades, entidades, estadosSecop, unspscCodes, nits, departamentos] =
    await Promise.all([
      getParametricaConfig(),
      listModalidades(),
      listEntidades(),
      listEstadosSecop(),
      listUnspscCodes(),
      listNits(),
      listDepartamentos(),
    ]);

  // Solo las ciudades ya seleccionadas (no el catálogo completo): el picker
  // busca el resto bajo demanda contra el servidor.
  const ciudadesSeleccionadas = await listCiudadesByIds(config?.ciudadIds ?? []);

  return (
    <>
      <PageHeader
        title="Paramétrica"
        description="Configuración global de la búsqueda automática de procesos en SECOP."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <ParametricaForm
          config={config}
          catalogs={{ modalidades, entidades, estadosSecop, unspscCodes, nits, departamentos }}
          ciudadesSeleccionadas={ciudadesSeleccionadas}
        />
      </div>
    </>
  );
}
