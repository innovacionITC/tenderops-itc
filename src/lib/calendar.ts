import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

export type CalendarItem = {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  eventType: string | null;
  source: "event" | "task" | "secop_closing";
  processId: string | null;
};

// Ya no recibe userId: la API scopea los eventos al usuario autenticado del
// token, no a un id arbitrario.
export async function listCalendar(): Promise<CalendarItem[]> {
  const items = await apiFetch<ApiSchemas["CalendarItemResponse"][]>("/calendario");

  return items.map((i) => ({
    id: i.id,
    title: i.title,
    startDate: i.startDate,
    endDate: i.endDate,
    eventType: i.eventType,
    source: i.source as CalendarItem["source"],
    processId: i.processId,
  }));
}
