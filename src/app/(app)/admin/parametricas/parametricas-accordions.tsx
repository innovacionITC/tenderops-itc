"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ParametricaForm } from "../parametrica/parametrica-form";
import { EntidadesTable } from "../entidades/entidades-table";
import { ModalidadesTable } from "../modalidades/modalidades-table";
import { UnspscTable } from "../unspsc/unspsc-table";
import { DepartamentosTable } from "../departamentos/departamentos-table";
import { CiudadesTable } from "../ciudades/ciudades-table";
import type {
  ParametricaConfig,
  CatalogItem,
  ModalidadRow,
  EntidadRow,
  DepartamentoRow,
  CiudadRow,
} from "@/lib/parametrica";
import type { UnspscRow } from "@/lib/unspsc";

interface ParametricasAccordionsProps {
  config: ParametricaConfig | null;
  catalogs: {
    modalidades: CatalogItem[];
    entidades: CatalogItem[];
    estadosSecop: CatalogItem[];
    unspscCodes: UnspscRow[];
    departamentos: CatalogItem[];
  };
  ciudadesSeleccionadas: CatalogItem[];
  entidadesAdmin: EntidadRow[];
  modalidadesAdmin: ModalidadRow[];
  unspscAdmin: UnspscRow[];
  departamentosAdmin: DepartamentoRow[];
  ciudadesAdmin: CiudadRow[];
  departamentosForCiudades: CatalogItem[];
}

export function ParametricasAccordions({
  config,
  catalogs,
  ciudadesSeleccionadas,
  entidadesAdmin,
  modalidadesAdmin,
  unspscAdmin,
  departamentosAdmin,
  ciudadesAdmin,
  departamentosForCiudades,
}: ParametricasAccordionsProps) {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="secop">
        <AccordionTrigger>Configuración de SECOP</AccordionTrigger>
        <AccordionContent>
          <ParametricaForm
            config={config}
            catalogs={catalogs}
            ciudadesSeleccionadas={ciudadesSeleccionadas}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="entidades">
        <AccordionTrigger>Entidades</AccordionTrigger>
        <AccordionContent>
          <EntidadesTable rows={entidadesAdmin} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="modalidades">
        <AccordionTrigger>Modalidades</AccordionTrigger>
        <AccordionContent>
          <ModalidadesTable rows={modalidadesAdmin} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="unspsc">
        <AccordionTrigger>Códigos UNSPSC</AccordionTrigger>
        <AccordionContent>
          <UnspscTable rows={unspscAdmin} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="departamentos">
        <AccordionTrigger>Departamentos</AccordionTrigger>
        <AccordionContent>
          <DepartamentosTable rows={departamentosAdmin} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="ciudades">
        <AccordionTrigger>Ciudades</AccordionTrigger>
        <AccordionContent>
          <CiudadesTable rows={ciudadesAdmin} departamentos={departamentosForCiudades} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
