import type { ApiError } from "@/lib/api/client";

export type CalendarioErrorTipo =
  | "error_consulta"
  | "error_recuperacion"
  | "error_filtros"
  | "outlook_no_configurado"
  | "outlook_sin_permiso"
  | "outlook_no_disponible";

export function clasificarCalendarioError(e: unknown): CalendarioErrorTipo {
  if (e && typeof e === "object" && "code" in e) {
    const apiError = e as ApiError;
    if (apiError.code === "calendario_filtros_invalidos") return "error_filtros";
    if (apiError.code === "calendario_outlook_no_configurado") return "outlook_no_configurado";
    if (apiError.code === "calendario_outlook_sin_permiso") return "outlook_sin_permiso";
    if (apiError.code === "calendario_outlook_no_disponible") return "outlook_no_disponible";
    return "error_consulta";
  }
  return "error_recuperacion";
}

export const CALENDARIO_ERROR_MENSAJES: Record<CalendarioErrorTipo, string> = {
  error_consulta: "Ocurrió un error durante la consulta del calendario. Intenta de nuevo.",
  error_recuperacion: "No se pudo recuperar la información del calendario. Verifica tu conexión e intenta de nuevo.",
  error_filtros: "Los filtros aplicados son inválidos. Verifica el rango de fechas.",
  outlook_no_configurado: "El calendario del equipo no está configurado. Contacta al administrador.",
  outlook_sin_permiso: "TenderOps no tiene acceso al calendario del equipo en Microsoft 365. Contacta al administrador.",
  outlook_no_disponible: "No fue posible consultar Outlook en este momento.",
};

const RETRYABLE_ERRORS: CalendarioErrorTipo[] = [
  "outlook_no_disponible",
  "error_consulta",
  "error_recuperacion",
];

export function esReintentable(tipo: CalendarioErrorTipo): boolean {
  return RETRYABLE_ERRORS.includes(tipo);
}
