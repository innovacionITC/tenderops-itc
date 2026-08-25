import type { ApiError } from "@/lib/api/client";

export type AuditoriaErrorTipo =
  | "error_consulta"
  | "comunicacion_bd"
  | "error_recuperacion"
  | "error_filtros";

export function clasificarAuditoriaError(e: unknown): AuditoriaErrorTipo {
  if (e && typeof e === "object" && "code" in e) {
    const apiError = e as ApiError;
    if (apiError.code === "error_comunicacion_base_datos") return "comunicacion_bd";
    return "error_consulta";
  }
  return "error_recuperacion";
}

export const AUDITORIA_ERROR_MENSAJES: Record<AuditoriaErrorTipo, string> = {
  error_consulta: "Ocurrió un error durante la consulta de auditoría. Intenta de nuevo.",
  comunicacion_bd: "No se pudo establecer comunicación con la base de datos. Intenta de nuevo en unos momentos.",
  error_recuperacion: "No se pudo recuperar la información de auditoría. Verifica tu conexión e intenta de nuevo.",
  error_filtros: "Los filtros aplicados son inválidos. Verifica los parámetros de búsqueda.",
};
