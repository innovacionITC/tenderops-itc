import { useState } from "react";
import type { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

// Toma el primer mensaje por campo (path[0]) de un ZodError — usado por todos
// los formularios de admin para mostrar el error debajo del input en vez de
// solo un toast genérico.
export function zodIssuesToFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString();
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// Estado + helpers repetidos en cada formulario de admin con errores por
// campo: guarda los errores, y clearFieldError borra uno solo (se llama en
// cada onChange para que el error desaparezca apenas el usuario corrige).
export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return { fieldErrors, setFieldErrors, clearFieldError };
}
