import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/env.server";
import { PerfilesError } from "./errors";
import type { DocumentStorage } from "./repository";

const BUCKET = "professional-documents";

function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

export function createSupabaseStorage(): DocumentStorage {
  let client: SupabaseClient | null = null;

  function getClient() {
    const url = supabaseUrl();
    const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new PerfilesError(
        503,
        "perfiles_storage_unconfigured",
        "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para el bucket privado de documentos.",
      );
    }
    if (!client) {
      client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return client;
  }

  return {
    configured() {
      return Boolean(supabaseUrl() && serverEnv.SUPABASE_SERVICE_ROLE_KEY);
    },
    async upload(path, bytes, contentType) {
      const { error } = await getClient().storage.from(BUCKET).upload(path, bytes, {
        contentType,
        upsert: true,
      });
      if (error) {
        throw new PerfilesError(500, "perfiles_storage_upload", `No se pudo guardar el archivo: ${error.message}`);
      }
    },
    async download(path) {
      const { data, error } = await getClient().storage.from(BUCKET).download(path);
      if (error || !data) {
        throw new PerfilesError(404, "perfiles_storage_missing", "El archivo no está en Storage.");
      }
      return Buffer.from(await data.arrayBuffer());
    },
    async remove(path) {
      const { error } = await getClient().storage.from(BUCKET).remove([path]);
      if (error) {
        throw new PerfilesError(500, "perfiles_storage_remove", `No se pudo eliminar el archivo: ${error.message}`);
      }
    },
  };
}
