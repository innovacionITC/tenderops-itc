import { z } from "zod";
import { APP_ROLES } from "@/lib/auth/roles";

export const createUsuarioSchema = z
  .object({
    fullName: z.string().trim().min(1, "El nombre es obligatorio"),
    email: z.string().trim().min(1, "El correo es obligatorio").email("Correo inválido"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    role: z.enum(APP_ROLES),
    organizacionIds: z.array(z.uuid()).min(1, "Debe asignar al menos una organización"),
  })
  .refine((data) => !data.password || data.password.length >= 8, {
    message: "La contraseña debe tener al menos 8 caracteres",
    path: ["password"],
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
