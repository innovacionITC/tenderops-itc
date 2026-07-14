import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth/session";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();

  return (
    <AppShell userEmail={auth.email} role={auth.role}>
      {children}
    </AppShell>
  );
}
