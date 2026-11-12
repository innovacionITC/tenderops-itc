import "server-only";
import { ApiError, apiFetch, apiFetchRaw } from "@/lib/api/client";
import type { ProfessionalFilters, ProfessionalIndicators } from "./contracts";
import { PerfilesError } from "./errors";
import type { DocumentStorage, ProfessionalRepository } from "./repository";
import type { StoredProfessional } from "./stored";

function mapError(error: unknown, missingMeansUnimplemented = false): never {
  if (error instanceof PerfilesError) throw error;
  if (error instanceof ApiError) {
    if (missingMeansUnimplemented && error.status === 404) {
      throw new PerfilesError(
        503,
        "perfiles_api_missing",
        "El API .NET aún no expone /perfiles. Las keys de Supabase ya están en el backend: hay que agregar los endpoints documentados en docs/architecture/perfiles-api-contract.md.",
      );
    }
    throw new PerfilesError(error.status, error.code ?? "api", error.message);
  }
  throw error;
}

function filterQuery(filters: ProfessionalFilters, page?: number, pageSize?: number, extra?: Record<string, string | number | undefined>) {
  return {
    buscar: filters.search,
    profession: filters.profession,
    profile: filters.profile,
    specialty: filters.specialty,
    technology: filters.technology,
    certification: filters.certification,
    city: filters.city,
    availability: filters.availability,
    status: filters.status,
    verification: filters.verification,
    minYears: filters.minYears,
    sort: filters.sort,
    page,
    pageSize,
    ...extra,
  };
}

export function createApiRepository(): ProfessionalRepository {
  return {
    async tableExists() {
      return true;
    },

    async list(_org, filters, page, pageSize) {
      try {
        return await apiFetch<{ items: StoredProfessional[]; total: number }>("/perfiles", {
          query: filterQuery(filters, page, pageSize),
        });
      } catch (error) {
        mapError(error, true);
      }
    },

    async listAll() {
      try {
        const result = await apiFetch<{ items: StoredProfessional[]; total: number }>("/perfiles", {
          query: { todos: 1, page: 1, pageSize: 5000 },
        });
        return result.items;
      } catch (error) {
        mapError(error, true);
      }
    },

    async get(_org, id) {
      try {
        return await apiFetch<StoredProfessional>(`/perfiles/${id}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        mapError(error);
      }
    },

    async getByExternalId(_org, externalId) {
      try {
        return await apiFetch<StoredProfessional>("/perfiles/clave", { query: { externalId } });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        mapError(error, true);
      }
    },

    async getByFingerprint(_org, fingerprint) {
      try {
        return await apiFetch<StoredProfessional>("/perfiles/clave", { query: { fingerprint } });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        mapError(error, true);
      }
    },

    async upsert(row) {
      try {
        return await apiFetch<StoredProfessional>(`/perfiles/${row.id}`, { method: "PUT", body: row });
      } catch (error) {
        mapError(error, true);
      }
    },

    async indicators() {
      try {
        return await apiFetch<ProfessionalIndicators>("/perfiles/indicadores");
      } catch (error) {
        mapError(error, true);
      }
    },

    async listByTender(_org, tenderId) {
      try {
        const result = await apiFetch<{ items: StoredProfessional[]; total: number }>("/perfiles", {
          query: { tenderId, page: 1, pageSize: 200 },
        });
        return result.items;
      } catch (error) {
        mapError(error, true);
      }
    },
  };
}

export function createApiStorage(): DocumentStorage {
  return {
    configured() {
      return true;
    },
    async upload(path, bytes, contentType) {
      try {
        const fd = new FormData();
        fd.set("path", path);
        fd.set("contentType", contentType);
        const fileName = path.split("/").pop() ?? "archivo";
        fd.set("file", new File([new Uint8Array(bytes)], fileName, { type: contentType }));
        await apiFetch("/perfiles/archivos", { method: "POST", body: fd });
      } catch (error) {
        mapError(error, true);
      }
    },
    async download(path) {
      try {
        const res = await apiFetchRaw("/perfiles/archivos", { query: { path } });
        if (!res.ok) {
          throw new ApiError(res.status, { status: res.status, detail: "No se pudo descargar el archivo del API." });
        }
        return Buffer.from(await res.arrayBuffer());
      } catch (error) {
        mapError(error, true);
      }
    },
    async remove(path) {
      try {
        await apiFetch("/perfiles/archivos", { method: "DELETE", query: { path } });
      } catch (error) {
        mapError(error, true);
      }
    },
  };
}
