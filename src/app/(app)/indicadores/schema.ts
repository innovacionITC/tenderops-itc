import { z } from "zod";

const UNIDADES = ["COP", "%", "ratio", "numero"] as const;
const TIPOS = ["base", "derivado"] as const;

// Espeja las reglas de CreateIndicadorRequestValidator/UpdateIndicadorRequestValidator del
// backend: numerador/denominador son obligatorios solo cuando tipo="derivado".
export const indicadorSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"),
    categoria: z.string().trim().min(1, "La categoría es obligatoria"),
    unidad: z.enum(UNIDADES),
    tipo: z.enum(TIPOS),
    formulaNumeradorIds: z.array(z.uuid()).optional(),
    formulaDenominadorIds: z.array(z.uuid()).optional(),
    formulaMultiplicador: z.number().optional(),
  })
  .refine((v) => v.tipo !== "derivado" || (v.formulaNumeradorIds?.length ?? 0) > 0, {
    message: "Los indicadores base del numerador son obligatorios para un indicador derivado",
    path: ["formulaNumeradorIds"],
  })
  .refine((v) => v.tipo !== "derivado" || (v.formulaDenominadorIds?.length ?? 0) > 0, {
    message: "Los indicadores base del denominador son obligatorios para un indicador derivado",
    path: ["formulaDenominadorIds"],
  });

export const guardarValoresSchema = z.array(
  z.object({
    indicadorId: z.uuid(),
    suborganizacionId: z.uuid().optional(),
    valor: z.number(),
  }),
);

export const calculadoraPluralSchema = z.object({
  anio: z.number().int(),
  metodo: z.enum(["ponderado", "sumado"]),
  participaciones: z
    .array(
      z.object({
        participanteId: z.uuid(),
        porcentaje: z.number().gt(0, "El porcentaje debe ser mayor que 0"),
      }),
    )
    .min(1, "Las participaciones no pueden estar vacías"),
});
