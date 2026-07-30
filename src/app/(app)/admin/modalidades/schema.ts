import { z } from "zod";

export const modalidadSchema = z.object({
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
  codigo: z.string().trim().min(1, "El código es obligatorio"),
});
