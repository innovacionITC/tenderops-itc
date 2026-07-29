import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  // Base URL de la API .NET (tenderops-api). El front es un BFF: todos los
  // Server Components y Server Actions pasan por ella (Fase 7 del plan).
  TENDEROPS_API_URL: z.url(),
  // SSO con Microsoft Entra ID (authorization code flow + PKCE hecho por el
  // BFF). Opcionales: sin ellos el botón de Microsoft redirige con error.
  MICROSOFT_TENANT_ID: z.string().min(1).optional(),
  MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
  MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),
  // Legado (Fase 10 los retira del todo): solo drizzle-kit los usa ya.
  DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsed = serverEnvSchema.safeParse({
  TENDEROPS_API_URL: process.env.TENDEROPS_API_URL,
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID || undefined,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || undefined,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || undefined,
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid server environment variables: ${z.prettifyError(parsed.error)}`);
}

export const serverEnv = parsed.data;
