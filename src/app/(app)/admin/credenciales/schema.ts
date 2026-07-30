import { z } from "zod";

const claveSchema = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]*$/, "Usa MAYÚSCULAS_CON_GUION_BAJO");

export const credentialCreateSchema = z.object({
  clave: claveSchema,
  valor: z.string().trim().min(1, "El valor es obligatorio"),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
});

// En edición "valor" se deja opcional a propósito: la API nunca devuelve el
// secreto guardado, así que dejarlo en blanco significa "no cambiar el
// valor actual" — obligarlo forzaría a repegar el secreto solo para editar
// la descripción.
export const credentialUpdateSchema = z.object({
  valor: z.string().trim().optional(),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
});
