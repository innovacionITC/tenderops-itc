import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type OrganizacionRow = {
  id: string;
  nombre: string;
  email: string | null;
  phone: string | null;
  code: string;
  taxId: string | null;
  estado: boolean | null;
};

export async function listOrganizaciones(): Promise<OrganizacionRow[]> {
  const rows = await apiFetch<ApiSchemas["OrganizacionResponse"][]>("/organizaciones");

  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    code: r.code,
    taxId: r.taxId ?? null,
    estado: r.isActive,
  }));
}
