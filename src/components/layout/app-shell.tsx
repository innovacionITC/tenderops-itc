"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { roleLabels } from "@/lib/format";
import type { AppRole } from "@/lib/auth/roles";
import type { OrganizationSummary } from "@/lib/auth/session";
import { isMenuItemVisible, menuItems } from "./nav-config";
import { CrystalRail } from "./crystal-rail";
import { NotificationsBell } from "./notifications-bell";
import { OrganizationSwitcher } from "./organization-switcher";
import { version as appVersion } from "../../../package.json";

export function AppShell({
  children,
  userEmail,
  role,
  activeOrganizationId,
  organizations,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  role: AppRole | null;
  activeOrganizationId: string;
  organizations: OrganizationSummary[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items = useMemo(
    () => menuItems.filter((item) => isMenuItemVisible(item, role)),
    [role],
  );

  const handleLogout = async () => {
    // Server Action: revoca la familia de refresh tokens en la API, borra las
    // cookies httpOnly (el cliente no puede tocarlas) y redirige a /login.
    await logout();
  };

  return (
    <div className="crystal-app flex min-h-screen flex-col">
      <div className="crystal-stage flex min-w-0 flex-1 flex-col">
        <header className="crystal-header sticky top-0 z-30 flex h-11 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <OrganizationSwitcher
              activeOrganizationId={activeOrganizationId}
              organizations={organizations}
            />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationsBell />
            <div className="hidden min-w-0 text-right sm:block">
              <div className="max-w-[160px] truncate text-sm font-medium text-foreground">
                {userEmail}
              </div>
              <div className="text-xs text-muted-foreground">{role ? roleLabels[role] : "—"}</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary sm:hidden">
              {userEmail?.[0]?.toUpperCase() ?? "U"}
            </div>
            <button
              onClick={handleLogout}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <CrystalRail
        items={items}
        pathname={pathname}
        onNavigate={(href) => router.push(href)}
        logo={
          <>
            <div className="crystal-mark" aria-hidden>
              T
            </div>
            <div className="crystal-rail-label crystal-brand-copy">
              <div className="leading-tight font-semibold">TenderOps</div>
              <div className="text-[10px] tracking-wider uppercase opacity-60">Intelecto · xRM</div>
            </div>
          </>
        }
        footer={<div className="crystal-rail-label">TenderOps v{appVersion}</div>}
      />
    </div>
  );
}
