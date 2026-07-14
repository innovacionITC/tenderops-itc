import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { hasAnyRole } from "@/lib/auth/roles";
import { listCalendar } from "@/lib/calendar";
import { listTasks } from "@/lib/tasks";
import { CalendarView } from "./calendar-view";

export default async function CalendarioPage() {
  const { userId, role } = await requireAuth();
  const [events, tasks] = await Promise.all([listCalendar(userId), listTasks()]);

  return (
    <>
      <PageHeader
        title="Calendario y tareas"
        description="Vista mensual de eventos, cierres SECOP y tareas. Lista de tareas del equipo a la derecha."
      />
      <CalendarView
        events={events}
        tasks={tasks}
        currentUserId={userId}
        canManageAll={hasAnyRole(role, ["administrador", "director"])}
      />
    </>
  );
}
