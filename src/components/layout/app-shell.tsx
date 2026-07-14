"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { roleLabels } from "@/lib/format";
import type { AppRole } from "@/lib/auth/roles";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu on navigation. Adjusting state during render
  // (rather than in a useEffect) avoids the extra render-then-effect pass —
  // see https://react.dev/learn/you-might-not-need-an-effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  const handleLogout = async () => {
    await createClient().auth.signOut();
    window.location.assign("/login");
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sky-500 font-bold text-sidebar-primary-foreground shadow-sm">
            T
          </div>
          <div>
            <div className="leading-tight font-semibold text-sidebar-foreground">TenderOps</div>
            <div className="text-[10px] tracking-wider text-sidebar-foreground/60 uppercase">
              Intelecto · xRM
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {menuGroups.map((group) => {
          const visible = group.items.filter((item) => isMenuItemVisible(item, role));
          if (visible.length === 0) return null;
          return (
            <div key={group.title} className="mb-4">
              <div className="mb-1 px-5 text-[10px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
                {group.title}
              </div>
              {visible.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                if (item.comingSoon) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 border-l-2 border-transparent px-5 py-2 text-sm text-sidebar-foreground/40"
                      title="Próximamente"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                      <span className="ml-auto rounded bg-sidebar-foreground/10 px-1.5 py-0.5 text-[9px] uppercase">
                        Pronto
                      </span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 border-l-2 px-5 py-2 text-sm transition-colors ${
                      active
                        ? "border-sidebar-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="border-t p-3 text-[11px] text-sidebar-foreground/60">
        Fase 1 · Base Next.js
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col self-start border-r bg-sidebar text-sidebar-foreground lg:flex">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-72 max-w-[85vw] flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
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
