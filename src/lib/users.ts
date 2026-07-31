import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";
import type { AppRole } from "@/lib/auth/roles";

export type UserOrganizacionRow = {
  id: string;
  nombre: string;
  estado: boolean;
};

export type UserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  role: AppRole | null;
  organizaciones: UserOrganizacionRow[];
};

export async function listUsers(): Promise<UserRow[]> {
  const rows = await apiFetch<ApiSchemas["UsuarioResponse"][]>("/usuarios");

  return rows.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    avatarUrl: u.avatarUrl,
    status: u.status,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    role: (u.role as AppRole | null) ?? null,
    organizaciones: u.organizaciones.map((o) => ({
      id: o.id,
      nombre: o.name,
      estado: o.isActive,
    })),
  }));
}
