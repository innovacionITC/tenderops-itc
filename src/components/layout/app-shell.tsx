"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { roleLabels } from "@/lib/format";
import type { AppRole } from "@/lib/auth/roles";
import { ItcMenu, type MenuItem as ItcMenuItem } from "@/components/itc";
import { isMenuItemVisible, menuGroups } from "./nav-config";
import { NotificationsBell } from "./notifications-bell";

export function AppShell({
  children,
  userEmail,
  role,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  role: AppRole | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const { items, expandedGroupIds } = useMemo(() => {
    const expandedGroupIds: string[] = [];
    const items: ItcMenuItem[] = [];

    for (const group of menuGroups) {
      const visible = group.items.filter((item) => isMenuItemVisible(item, role));
      if (visible.length === 0) continue;

      const groupId = `group-${group.title}`;
      expandedGroupIds.push(groupId);
      items.push({
        id: groupId,
        label: group.title,
        children: visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return {
            id: item.href,
            label: item.label,
            disabled: item.comingSoon,
            icon: (
              <item.icon className="h-4 w-4" {...(active ? { "data-nav-active": true } : {})} />
            ),
            badge: item.comingSoon ? (
              <span className="rounded bg-sidebar-foreground/10 px-1.5 py-0.5 text-[9px] uppercase">
                Pronto
              </span>
            ) : undefined,
          };
        }),
      });
    }

    return { items, expandedGroupIds };
  }, [pathname, role]);

  const handleItemClick = (item: ItcMenuItem) => {
    if (item.children) return; // grupo: ItcMenu ya maneja el expand/collapse
    router.push(item.id); // id === href para los ítems hoja, ver items arriba
  };

  const handleLogout = async () => {
    // Server Action: revoca la familia de refresh tokens en la API, borra las
    // cookies httpOnly (el cliente no puede tocarlas) y redirige a /login.
    await logout();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <ItcMenu
        className="app-sidebar-menu"
        variant="sidebar"
        items={items}
        width="16rem"
        responsive
        breakpoint="lg"
        showHamburger
        closeOnSelect
        bordered
        showIcons
        iconPosition="left"
        allowNested
        expandMode="multiple"
        defaultExpanded={expandedGroupIds}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onItemClick={handleItemClick}
        ariaLabel="Navegación principal"
        logo={
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 font-bold text-white shadow-sm">
              T
            </div>
            <div>
              <div className="leading-tight font-semibold text-sidebar-foreground">TenderOps</div>
              <div className="text-[10px] tracking-wider text-sidebar-foreground/60 uppercase">
                Intelecto · xRM
              </div>
            </div>
          </div>
        }
        footer={
          <div className="text-[11px] text-sidebar-foreground/60">Fase 1 · Base Next.js</div>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden truncate text-sm text-muted-foreground sm:block">
              Organización: <span className="font-medium text-foreground">Intelecto</span>
            </div>
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
              className="text-muted-foreground transition-colors hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
