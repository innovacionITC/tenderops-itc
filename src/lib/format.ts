const TZ = "America/Bogota";

export const formatCOP = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
};

export const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
};

export const formatDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
};

export const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  administrador: "Administrador",
  director: "Director / Aprobador",
  gestor: "Gestor de Licitaciones",
  consultor: "Consultor",
  lectura: "Solo lectura",
};
