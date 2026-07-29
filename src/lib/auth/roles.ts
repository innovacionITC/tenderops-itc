// Espejo del enum Postgres `app_role` (y de TenderOps.Domain.AppRole en la
// API). Definido a mano desde la Fase 7: el front ya no importa el schema de
// Drizzle.
export const APP_ROLES = ["administrador", "director", "gestor", "consultor", "lectura"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function hasAnyRole(role: AppRole | null, allowed: AppRole[]): boolean {
  return role !== null && allowed.includes(role);
}

export function canFollow(role: AppRole | null) {
  return hasAnyRole(role, ["administrador", "director", "gestor"]);
}

export function canApprove(role: AppRole | null) {
  return hasAnyRole(role, ["administrador", "director"]);
}

export function canAdmin(role: AppRole | null) {
  return role === "administrador";
}
