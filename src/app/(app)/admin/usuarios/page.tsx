import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listUsers } from "@/lib/users";
import { UsersTable } from "./users-table";

export default async function UsuariosPage() {
  const auth = await requireAuth(["administrador"]);
  const users = await listUsers();

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Gestión de roles y estado de acceso de los usuarios de TenderOps."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <UsersTable users={users} currentUserId={auth.userId} currentUserRole={auth.role} />
      </div>
    </>
  );
}
