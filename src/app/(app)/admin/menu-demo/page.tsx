import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { MenuDemoClient } from "./menu-demo-client";

export default async function MenuDemoPage() {
  await requireAuth(["administrador"]);

  return (
    <>
      <PageHeader
        title="Demo: ItcMenu"
        description="Ruta temporal para verificar en vivo el error de ItcMenu (no exportado en itc-frontend-base@1.1.3)."
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <MenuDemoClient />
      </div>
    </>
  );
}
