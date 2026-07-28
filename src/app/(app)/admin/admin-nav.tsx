"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/parametrica", label: "Paramétrica" },
  { href: "/admin/credenciales", label: "Credenciales" },
  { href: "/admin/entidades", label: "Entidades" },
  { href: "/admin/modalidades", label: "Modalidades" },
  { href: "/admin/nits", label: "NITs" },
  { href: "/admin/unspsc", label: "Códigos UNSPSC" },
  { href: "/admin/departamentos", label: "Departamentos" },
  { href: "/admin/ciudades", label: "Ciudades" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b bg-card px-4 sm:px-6 lg:px-8">
      <nav className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
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
