import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type TaskRow = {
  id: string;
  title: string;
  processId: string | null;
  processTitle: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: string | null;
  status: string | null;
  dueDate: string | null;
};

export async function listTasks(): Promise<TaskRow[]> {
  const rows = await apiFetch<ApiSchemas["TareaResponse"][]>("/tareas");

  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    processId: t.processId,
    processTitle: t.processTitle,
    assignedTo: t.assignedTo,
    assignedToName: t.assignedToName,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
  }));
}
