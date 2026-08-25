import type { ApiError } from "@/lib/api/client";

export type CalendarioErrorTipo =
  | "error_consulta"
  | "comunicacion_bd"
  | "error_recuperacion"
  | "error_filtros";

export function clasificarCalendarioError(e: unknown): CalendarioErrorTipo {
  if (e && typeof e === "object" && "code" in e) {
    const apiError = e as ApiError;
    if (apiError.code === "calendario_filtros_invalidos") return "error_filtros";
    if (apiError.code === "error_comunicacion_base_datos") return "comunicacion_bd";
    return "error_consulta";
  }
  return "error_recuperacion";
}

export const CALENDARIO_ERROR_MENSAJES: Record<CalendarioErrorTipo, string> = {
  error_consulta: "Ocurrió un error durante la consulta del calendario. Intenta de nuevo.",
  comunicacion_bd: "No se pudo establecer comunicación con la base de datos. Intenta de nuevo en unos momentos.",
  error_recuperacion: "No se pudo recuperar la información del calendario. Verifica tu conexión e intenta de nuevo.",
  error_filtros: "Los filtros aplicados son inválidos. Verifica el rango de fechas.",
};
