import { requireAuth } from "@/lib/auth/session";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth(["superadmin", "administrador"]);

  return (
    <>
      <AdminNav role={auth.role} />
      {children}
    </>
  );
}
