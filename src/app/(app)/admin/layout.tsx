import { requireAuth } from "@/lib/auth/session";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(["administrador"]);

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
