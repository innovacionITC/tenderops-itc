import { z } from "zod";

// Aparte de actions.ts (que tiene "use server") a propósito: un archivo
// "use server" solo puede exportar funciones async, así que un objeto Zod
// exportado desde ahí no sobrevive al cruce cliente/servidor — en el bundle
// del cliente queda como un stub roto (`createSchema.safeParse is not a
// function`). Este archivo lo importan tanto actions.ts (validación antes de
// pegarle a la API) como organizaciones-table.tsx (validación en el cliente).
// Nombre/correo/teléfono/código son obligatorios; taxId (NIT propio de la
// organización) es opcional — no toda organización lo tiene registrado al
// crearse.
export const createSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().min(1, "El correo es obligatorio").email("Correo inválido"),
  phone: z.string().trim().min(1, "El teléfono es obligatorio"),
  code: z.string().trim().min(1, "El código es obligatorio"),
  taxId: z.string().trim().optional(),
});
