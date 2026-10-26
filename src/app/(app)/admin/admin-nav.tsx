"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";

const TABS = [
  { href: "/admin/organizaciones", label: "Organizaciones", superadminOnly: true },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/plantillas", label: "Plantillas" },
  { href: "/admin/parametricas", label: "Paramétricas" },
  { href: "/admin/conocimiento-licitaciones", label: "Base de conocimiento" },
  { href: "/admin/credenciales", label: "Credenciales" },
];

export function AdminNav({ role }: { role: AppRole | null }) {
  const pathname = usePathname();

  return (
    <div className="border-b bg-card px-4 sm:px-6 lg:px-8">
      <nav className="flex gap-1 overflow-x-auto">
        {TABS.filter((tab) => !tab.superadminOnly || role === "superadmin").map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors ${
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
