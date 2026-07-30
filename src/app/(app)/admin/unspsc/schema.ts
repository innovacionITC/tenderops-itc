import { z } from "zod";

export const unspscSchema = z.object({
  codigo: z.string().trim().min(1, "El código es obligatorio"),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
});
