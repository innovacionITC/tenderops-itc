import { z } from "zod";

// Aparte de actions.ts ("use server" solo puede exportar funciones async) —
// ver el comentario equivalente en admin/organizaciones/schema.ts.
export const entidadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
});
