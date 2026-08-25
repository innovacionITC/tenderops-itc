import { APP_ROLES, type AppRole } from "@/lib/auth/roles";

export type AuditoriaRow = {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  module: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: string | null;
  result: string | null;
  createdAt: string;
  role: string | null;
  ipAddress: string | null;
  observations: string | null;
  operationType: string;
  description: string;
};

export type AuditoriaFiltrosDisponibles = {
  usuarios: { id: string; name: string }[];
};

export const AUDITORIA_MODULOS = [
  "administracion",
  "credenciales",
  "notificaciones",
  "parametrica",
  "seguimiento",
  "secop",
  "seguridad",
  "tareas",
  "unspsc",
  "usuarios",
] as const;

export const AUDITORIA_TIPOS_OPERACION = [
  "Creación",
  "Actualización",
  "Eliminación",
  "Sincronización",
  "Inicio de sesión",
  "Cierre de sesión",
  "Otro",
] as const;

export const AUDITORIA_RESULTADOS = ["ok", "error"] as const;

export const AUDITORIA_ROLES: readonly AppRole[] = APP_ROLES;

export const AUDITORIA_MENSAJE_VACIO =
  "No existen registros de auditoría para los criterios de búsqueda seleccionados.";
