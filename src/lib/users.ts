import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { perfiles, rolesUsuario } from "@/db/schema/schema";
import type { AppRole } from "@/lib/auth/roles";

export type UserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  role: AppRole | null;
};

export async function listUsers(): Promise<UserRow[]> {
  return db
    .select({
      id: perfiles.id,
      fullName: perfiles.nombreCompleto,
      email: perfiles.email,
      avatarUrl: perfiles.urlAvatar,
      status: perfiles.estado,
      lastLoginAt: perfiles.fechaUltimoLogin,
      createdAt: perfiles.fechaCreacion,
      role: rolesUsuario.rol,
    })
    .from(perfiles)
    .leftJoin(rolesUsuario, eq(rolesUsuario.usuarioId, perfiles.id))
    .orderBy(asc(perfiles.fechaCreacion));
}
