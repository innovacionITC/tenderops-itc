import { z } from "zod";

export const suborganizacionSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
});
