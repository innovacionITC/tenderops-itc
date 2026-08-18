import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  processId: string | null;
  processTitle: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: string | null;
  status: string | null;
  dueDate: string | null;
};

// `description` todavía no está en schema.d.ts porque openapi.json no se ha
// regenerado desde que el backend lo agregó — se intersecta a mano solo ese
// campo en vez de duplicar los demás, que sí vienen del tipo generado.
type TareaResponse = ApiSchemas["TareaResponse"] & { description?: string | null };

export async function listTasks(processId?: string): Promise<TaskRow[]> {
  const rows = await apiFetch<TareaResponse[]>("/tareas", {
    query: processId ? { processId } : undefined,
  });

  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    processId: t.processId,
    processTitle: t.processTitle,
    assignedTo: t.assignedTo,
    assignedToName: t.assignedToName,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
  }));
}
