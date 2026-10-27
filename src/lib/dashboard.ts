import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

// Mismo shape que devolvía la versión Drizzle: counts numéricos, y
// estimatedValue como string (el `numeric` de Postgres llegaba como string vía
// Drizzle; la API lo manda como número y aquí se vuelve a string para no tocar
// los componentes que formatean moneda).
export async function getDashboard() {
  const data = await apiFetch<ApiSchemas["DashboardResponse"]>("/dashboard");

  return {
    counts: {
      total: Number(data.counts.total),
      followed: Number(data.counts.followed),
      upcoming7: Number(data.counts.upcoming7),
      marketStudies: Number(data.counts.marketStudies),
      pendingTasks: Number(data.counts.pendingTasks),
      overdueTasks: Number(data.counts.overdueTasks),
    },
    upcoming: data.upcoming.map((p) => ({
      id: p.id,
      secopTitle: p.secopTitle,
      entityName: p.entityName,
      closingDate: p.closingDate,
    })),
    presented: data.presented.map((p) => ({
      id: p.id,
      secopTitle: p.secopTitle,
      secopId: p.secopId,
      entityName: p.entityName,
      estimatedValue: p.estimatedValue == null ? null : String(p.estimatedValue),
      updatedAt: p.updatedAt,
    })),
  };
}
