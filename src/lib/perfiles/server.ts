import "server-only";
import { createApiRepository, createApiStorage } from "./api-adapter";
import { createProfessionalService } from "./service";

let singleton: ReturnType<typeof createProfessionalService> | null = null;

export function professionalService() {
  if (!singleton) {
    singleton = createProfessionalService(createApiRepository(), createApiStorage());
  }
  return singleton;
}
