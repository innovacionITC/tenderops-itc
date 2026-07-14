import { appRole } from "@/db/schema/schema";

export type AppRole = (typeof appRole.enumValues)[number];

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
