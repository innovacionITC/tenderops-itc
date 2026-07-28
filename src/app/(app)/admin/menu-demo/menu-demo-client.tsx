"use client";

import { House, Briefcase, FileText, Eye, Users, MessageSquare } from "lucide-react";
import { ItcMenu } from "itc-frontend-base";

export function MenuDemoClient() {
  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        height: "500px",
        padding: "2rem",
      }}
    >
      <ItcMenu
        bordered
        iconPosition="left"
        items={[
          {
            icon: <House size={18} />,
            id: "inicio",
            label: "Inicio",
          },
          {
            children: [
              {
                children: [
                  { id: "1", label: "Laboral" },
                  { id: "2", label: "Estudio" },
                ],
                id: "cat-1",
                label: "Certificaciones",
              },
              {
                children: [
                  { id: "3", label: "Predial" },
                  { id: "4", label: "Vehicular" },
                ],
                id: "cat-2",
                label: "Impuestos",
              },
              {
                children: [{ id: "5", label: "Consulta" }],
                id: "cat-3",
                label: "Estado de trámites",
              },
              {
                children: [{ id: "6", label: "Construcción" }],
                id: "cat-4",
                label: "Permisos",
              },
              {
                children: [{ id: "7", label: "Tránsito" }],
                id: "cat-5",
                label: "Multas",
              },
            ],
            icon: <Briefcase size={18} />,
            id: "servicios",
            label: "Servicios",
          },
          {
            icon: <FileText size={18} />,
            id: "tramites",
            label: "Trámites",
          },
          {
            icon: <Eye size={18} />,
            id: "transparencia",
            label: "Transparencia",
          },
          {
            icon: <Users size={18} />,
            id: "atencion",
            label: "Atención al ciudadano",
          },
          {
            icon: <MessageSquare size={18} />,
            id: "pqrs",
            label: "PQRS",
          },
        ]}
        onCollapse={() => {}}
        onExpand={() => {}}
        onItemClick={() => {}}
        responsive
        shadow
        showIcons
        theme="light"
        variant="sidebar"
        width="320px"
      />
    </div>
      
  );
}
