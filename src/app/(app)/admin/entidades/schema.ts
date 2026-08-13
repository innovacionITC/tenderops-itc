import { z } from "zod";

// Aparte de actions.ts ("use server" solo puede exportar funciones async) —
// ver el comentario equivalente en admin/organizaciones/schema.ts.
export const entidadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  nit: z
    .string()
    .trim()
    .min(1, "El NIT es obligatorio")
    .regex(/^\d+$/, "El NIT solo debe contener números"),
  dv: z
    .string()
    .trim()
    .regex(/^\d$/, "El dígito de verificación debe ser un solo número")
    .optional()
    .or(z.literal("")),
});
