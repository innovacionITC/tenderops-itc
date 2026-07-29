import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type UnspscRow = { id: string; codigo: string; descripcion: string | null };

export async function listUnspscCodes(): Promise<UnspscRow[]> {
  const rows = await apiFetch<ApiSchemas["CodigoUnspscResponse"][]>("/codigos-unspsc");
  return rows.map((r) => ({ id: r.id, codigo: r.code, descripcion: r.description }));
}
