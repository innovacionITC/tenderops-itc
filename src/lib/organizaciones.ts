import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type OrganizacionRow = {
  id: string;
  nombre: string;
  email: string | null;
  phone: string | null;
  nitId: string | null;
  nitDescripcion: string | null;
  estado: boolean | null;
  createdAt: string;
};

export async function listOrganizaciones(): Promise<OrganizacionRow[]> {
  const rows = await apiFetch<ApiSchemas["OrganizationResponse"][]>("/organizaciones");

  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    nitId: r.nitId ?? null,
    nitDescripcion: r.nitDescription ?? null,
    estado: r.isActive,
    createdAt: r.createdAt,
  }));
}
