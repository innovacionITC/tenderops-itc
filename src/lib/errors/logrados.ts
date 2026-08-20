import type { ApiError } from "@/lib/api/client";

export type LogradoErrorTipo =
  | "filtros"
  | "comunicacion_bd"
  | "error_consulta"
  | "error_recuperacion";

export function clasificarLogradoError(e: unknown): LogradoErrorTipo {
  if (e && typeof e === "object" && "code" in e) {
    const apiError = e as ApiError;
    if (apiError.code === "logrados_filtros_invalidos") return "filtros";
    if (apiError.code === "error_comunicacion_base_datos") return "comunicacion_bd";
    return "error_consulta";
  }
  return "error_recuperacion";
}

export const LOGRADO_ERROR_MENSAJES: Record<LogradoErrorTipo, string> = {
  filtros: "Los filtros aplicados son inválidos. Verifica el rango de fechas o valores.",
  comunicacion_bd: "No se pudo establecer comunicación con la base de datos. Intenta de nuevo en unos momentos.",
  error_consulta: "Ocurrió un error durante la consulta. Intenta de nuevo.",
  error_recuperacion: "No se pudo recuperar la información. Verifica tu conexión e intenta de nuevo.",
};
