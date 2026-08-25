import {
  Calendar,
  Eye,
  FileStack,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { canAdmin, canApprove, type AppRole } from "@/lib/auth/roles";

export type MenuItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  adminOnly?: boolean;
  privilegedOnly?: boolean; // admin + director
  comingSoon?: boolean; // not yet migrated from tenderops-itc
};

export const menuGroups: { title: string; items: MenuItem[] }[] = [
  { title: "General", items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }] },
  {
    title: "Licitaciones",
    items: [
      { href: "/secop", icon: Search, label: "Consulta SECOP" },
      { href: "/seguimiento", icon: Eye, label: "Procesos en seguimiento" },
    ],
  },
  {
    title: "Preparación",
    items: [
      { href: "/plantillas", icon: FileStack, label: "Plantillas" },
      { href: "/indicadores", icon: TrendingUp, label: "Indicadores", comingSoon: true },
    ],
  },
  {
    title: "Gestión",
    items: [{ href: "/calendario", icon: Calendar, label: "Calendario y tareas" }],
  },
  {
    title: "Sistema",
    items: [
      {
        href: "/auditoria",
        icon: ShieldCheck,
        label: "Auditoría",
        privilegedOnly: true,
      },
      {
        href: "/admin",
        icon: Settings,
        label: "Administración",
        adminOnly: true,
      },
    ],
  },
];

export function isMenuItemVisible(item: MenuItem, role: AppRole | null) {
  if (item.adminOnly) return canAdmin(role);
  if (item.privilegedOnly) return canApprove(role);
  return true;
}
