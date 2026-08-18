import "server-only";
import { apiFetch } from "@/lib/api/client";

export type UsuarioAsignableRow = {
  id: string;
  name: string;
};

type UsuarioAsignableResponse = {
  id: string;
  name: string;
};

export async function listUsuariosAsignables(): Promise<UsuarioAsignableRow[]> {
  const rows = await apiFetch<UsuarioAsignableResponse[]>("/usuarios/asignables");
  return rows.map((r) => ({ id: r.id, name: r.name ?? "—" }));
}
