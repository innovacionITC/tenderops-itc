import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import {
  getParametricaConfig,
  listCiudadesAdmin,
  listCiudadesByIds,
  listDepartamentos,
  listDepartamentosAdmin,
  listEntidades,
  listEntidadesAdmin,
  listEstadosSecop,
  listSuborganizacionesAdmin,
  listModalidades,
  listModalidadesAdmin,
} from "@/lib/parametrica";
import { listUnspscCodes } from "@/lib/unspsc";
import { ParametricasAccordions } from "./parametricas-accordions";

export default async function ParametricasPage() {
  await requireAuth(["administrador"]);

  const [
    config,
    modalidades,
    entidades,
    estadosSecop,
    unspscCodes,
    departamentos,
    entidadesAdmin,
    suborganizacionesAdmin,
    modalidadesAdmin,
    unspscAdmin,
    departamentosAdmin,
    ciudadesAdmin,
  ] = await Promise.all([
    getParametricaConfig(),
    listModalidades(),
    listEntidades(),
    listEstadosSecop(),
    listUnspscCodes(),
    listDepartamentos(),
    listEntidadesAdmin(),
    listSuborganizacionesAdmin(),
    listModalidadesAdmin(),
    listUnspscCodes(),
    listDepartamentosAdmin(),
    listCiudadesAdmin(),
  ]);

  const ciudadesSeleccionadas = await listCiudadesByIds(config?.ciudadIds ?? []);

  return (
    <>
      <PageHeader
        title="Paramétricas"
        description="Configuración y catálogos del sistema."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <ParametricasAccordions
          config={config}
          catalogs={{ modalidades, entidades, estadosSecop, unspscCodes, departamentos }}
          ciudadesSeleccionadas={ciudadesSeleccionadas}
          entidadesAdmin={entidadesAdmin}
          suborganizacionesAdmin={suborganizacionesAdmin}
          modalidadesAdmin={modalidadesAdmin}
          unspscAdmin={unspscAdmin}
          departamentosAdmin={departamentosAdmin}
          ciudadesAdmin={ciudadesAdmin}
          departamentosForCiudades={departamentos}
        />
      </div>
    </>
  );
}
