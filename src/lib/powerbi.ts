import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { ApiSchemas } from "@/lib/api/types";

// La URL la administra un admin en /admin/credenciales (POWERBI_EMBED_URL);
// la API la resuelve con su caché de 30 s y fallback a variable de entorno.
export async function getPowerBiEmbedUrl(): Promise<string | null> {
  const { url } = await apiFetch<ApiSchemas["PowerBiEmbedUrlResponse"]>("/powerbi/embed-url");
  return url;
}
