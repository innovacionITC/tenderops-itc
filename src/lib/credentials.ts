import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type CredentialRow = {
  id: string;
  clave: string;
  hasValue: boolean;
  descripcion: string | null;
  fechaModificacion: string;
};

// La API jamás serializa `valor` — solo `hasValue` (calculado en SQL), así el
// secreto nunca llega al payload RSC. La lectura runtime de credenciales
// (getCredential) vive ahora en la API (ICredentialValueProvider).
export async function listCredentials(): Promise<CredentialRow[]> {
  const rows = await apiFetch<ApiSchemas["CredencialResponse"][]>("/credenciales");

  return rows.map((r) => ({
    id: r.id,
    clave: r.key,
    hasValue: r.hasValue,
    descripcion: r.description,
    fechaModificacion: r.updatedAt,
  }));
}
