import { z } from "zod";

export const ciudadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  departamentoId: z.uuid("Selecciona un departamento"),
});
