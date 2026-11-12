import { computeIndicators } from "./stored";
import type { ProfessionalFilters } from "./contracts";
import type { DocumentStorage, ProfessionalRepository } from "./repository";
import type { StoredProfessional } from "./stored";

function matches(row: StoredProfessional, filters: ProfessionalFilters): boolean {
  const blob = [
    row.fullName,
    row.profession,
    row.primaryProfile,
    row.specialty,
    row.city,
    ...row.education.flatMap((item) => [item.title, item.institution]),
    ...row.experiences.flatMap((item) => [item.client, item.project, item.role, ...item.technologies]),
    ...row.certifications.flatMap((item) => [item.name, item.issuer]),
    ...row.skills.map((item) => item.name),
  ]
    .join(" ")
    .toLocaleLowerCase("es-CO");
  if (filters.search && !blob.includes(filters.search.toLocaleLowerCase("es-CO"))) return false;
  if (filters.profession && !row.profession.toLocaleLowerCase("es-CO").includes(filters.profession.toLocaleLowerCase("es-CO"))) {
    return false;
  }
  if (filters.profile && !row.primaryProfile.toLocaleLowerCase("es-CO").includes(filters.profile.toLocaleLowerCase("es-CO"))) {
    return false;
  }
  if (filters.specialty && !row.specialty.toLocaleLowerCase("es-CO").includes(filters.specialty.toLocaleLowerCase("es-CO"))) {
    return false;
  }
  if (filters.city && row.city !== filters.city) return false;
  if (filters.availability && row.availability !== filters.availability) return false;
  if (filters.status && row.status !== filters.status) return false;
  if (filters.verification && row.verificationStatus !== filters.verification) return false;
  if (filters.minYears && row.generalExperienceMonths / 12 < filters.minYears) return false;
  if (filters.certification && !blob.includes(filters.certification.toLocaleLowerCase("es-CO"))) return false;
  if (filters.technology && !blob.includes(filters.technology.toLocaleLowerCase("es-CO"))) return false;
  return true;
}

export function createMemoryRepository(seed: StoredProfessional[] = []): ProfessionalRepository {
  const rows = new Map(seed.map((item) => [item.id, structuredClone(item)]));

  return {
    async tableExists() {
      return true;
    },
    async list(organizationId, filters, page, pageSize) {
      const items = [...rows.values()]
        .filter((item) => item.organizationId === organizationId)
        .filter((item) => matches(item, filters))
        .sort((a, b) => {
          if (filters.sort === "full_name") return a.fullName.localeCompare(b.fullName, "es");
          if (filters.sort === "experiencia") return b.generalExperienceMonths - a.generalExperienceMonths;
          return b.updatedAt.localeCompare(a.updatedAt);
        });
      const start = (page - 1) * pageSize;
      return { items: items.slice(start, start + pageSize).map((item) => structuredClone(item)), total: items.length };
    },
    async listAll(organizationId) {
      return [...rows.values()]
        .filter((item) => item.organizationId === organizationId)
        .map((item) => structuredClone(item));
    },
    async get(organizationId, id) {
      const row = rows.get(id);
      if (!row || row.organizationId !== organizationId) return null;
      return structuredClone(row);
    },
    async getByExternalId(organizationId, externalId) {
      const row = [...rows.values()].find(
        (item) => item.organizationId === organizationId && item.externalId === externalId,
      );
      return row ? structuredClone(row) : null;
    },
    async getByFingerprint(organizationId, fingerprint) {
      const row = [...rows.values()].find(
        (item) => item.organizationId === organizationId && item.identityFingerprint === fingerprint,
      );
      return row ? structuredClone(row) : null;
    },
    async upsert(row) {
      rows.set(row.id, structuredClone(row));
      return structuredClone(row);
    },
    async indicators(organizationId) {
      return computeIndicators([...rows.values()].filter((item) => item.organizationId === organizationId));
    },
    async listByTender(organizationId, tenderId) {
      return [...rows.values()]
        .filter(
          (item) =>
            item.organizationId === organizationId &&
            item.tenderAssignments.some((assignment) => assignment.tenderId === tenderId && assignment.status !== "retirado"),
        )
        .map((item) => structuredClone(item));
    },
  };
}

export function createMemoryStorage(): DocumentStorage & { files: Map<string, Buffer> } {
  const files = new Map<string, Buffer>();
  return {
    files,
    configured() {
      return true;
    },
    async upload(path, bytes) {
      files.set(path, Buffer.from(bytes));
    },
    async download(path) {
      const data = files.get(path);
      if (!data) throw new Error(`Archivo no encontrado: ${path}`);
      return Buffer.from(data);
    },
    async remove(path) {
      files.delete(path);
    },
  };
}
