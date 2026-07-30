import { z } from "zod";

export const nitSchema = z.object({
  nit: z.string().trim().min(1, "El NIT es obligatorio"),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
});
