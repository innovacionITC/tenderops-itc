// Espejo del enum Postgres `app_role` (y de TenderOps.Domain.AppRole en la
// API). Definido a mano desde la Fase 7: el front ya no importa el schema de
// Drizzle. El orden ES la jerarquía, de mayor a menor privilegio — no
// reordenar sin revisar ROLE_RANK más abajo.
export const APP_ROLES = ["superadmin", "administrador", "director", "gestor", "consultor", "lectura"] as const;

export type AppRole = (typeof APP_ROLES)[number];

const ROLE_RANK: Record<AppRole, number> = Object.fromEntries(
  APP_ROLES.map((role, index) => [role, APP_ROLES.length - index]),
) as Record<AppRole, number>;

// `allowed` funciona como "el rol mínimo requerido": cualquier rol con rango
// igual o mayor al más bajo de la lista pasa, aunque no esté listado
// explícitamente — así "superadmin" satisface un check de ["administrador"]
// sin tener que agregarlo a mano en cada llamada.
export function hasAnyRole(role: AppRole | null, allowed: AppRole[]): boolean {
  if (role === null || allowed.length === 0) return false;
  const minRequiredRank = Math.min(...allowed.map((r) => ROLE_RANK[r]));
  return ROLE_RANK[role] >= minRequiredRank;
}

export function canFollow(role: AppRole | null) {
  return hasAnyRole(role, ["administrador", "director", "gestor"]);
}

export function canApprove(role: AppRole | null) {
  return hasAnyRole(role, ["administrador", "director"]);
}

export function canAdmin(role: AppRole | null) {
  return hasAnyRole(role, ["administrador"]);
}

export function canConsult(role: AppRole | null) {
  return hasAnyRole(role, ["administrador", "director", "gestor", "consultor"]);
}
