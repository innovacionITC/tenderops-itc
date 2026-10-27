import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listOrganizacionesDisponibles, listUsers } from "@/lib/users";
import { UsersTable } from "./users-table";

export default async function UsuariosPage() {
  const auth = await requireAuth(["administrador"]);
  const [users, organizacionesDisponibles] = await Promise.all([
    listUsers(),
    listOrganizacionesDisponibles(),
  ]);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Gestión de roles y estado de acceso de los usuarios de TenderOps."
      />
      <div className="page-body">
        <UsersTable
          users={users}
          currentUserId={auth.userId}
          currentUserRole={auth.role}
          organizacionesDisponibles={organizacionesDisponibles}
        />
      </div>
    </>
  );
}
