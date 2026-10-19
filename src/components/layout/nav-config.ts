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
import { canAdmin, canApprove, canConsult, type AppRole } from "@/lib/auth/roles";

export type MenuItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  adminOnly?: boolean;
  privilegedOnly?: boolean; // admin + director
  consultOnly?: boolean; // admin + director + gestor + consultor (excluye "lectura")
  comingSoon?: boolean; // not yet migrated from tenderops-itc
};

export const menuItems: MenuItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/secop", icon: Search, label: "Consulta SECOP" },
  { href: "/seguimiento", icon: Eye, label: "Procesos en seguimiento" },
  { href: "/plantillas", icon: FileStack, label: "Plantillas" },
  { href: "/indicadores", icon: TrendingUp, label: "Indicadores", consultOnly: true },
  { href: "/calendario", icon: Calendar, label: "Calendario" },
  { href: "/auditoria", icon: ShieldCheck, label: "Auditoría", privilegedOnly: true },
  { href: "/admin", icon: Settings, label: "Administración", adminOnly: true },
];

export function isMenuItemVisible(item: MenuItem, role: AppRole | null) {
  if (item.adminOnly) return canAdmin(role);
  if (item.privilegedOnly) return canApprove(role);
  if (item.consultOnly) return canConsult(role);
  return true;
}
