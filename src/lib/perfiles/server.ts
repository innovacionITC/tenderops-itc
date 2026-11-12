import "server-only";
import { createProfessionalService } from "./service";
import { createSqlRepository } from "./sql-repository";
import { createSupabaseStorage } from "./supabase-storage";

let singleton: ReturnType<typeof createProfessionalService> | null = null;

export function professionalService() {
  if (!singleton) {
    singleton = createProfessionalService(createSqlRepository(), createSupabaseStorage());
  }
  return singleton;
}
