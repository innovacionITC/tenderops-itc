import type { ProfessionalFilters, ProfessionalIndicators } from "./contracts";
import type { StoredProfessional } from "./stored";

export interface ProfessionalRepository {
  tableExists(): Promise<boolean>;
  list(
    organizationId: string,
    filters: ProfessionalFilters,
    page: number,
    pageSize: number,
  ): Promise<{ items: StoredProfessional[]; total: number }>;
  listAll(organizationId: string): Promise<StoredProfessional[]>;
  get(organizationId: string, id: string): Promise<StoredProfessional | null>;
  getByExternalId(organizationId: string, externalId: string): Promise<StoredProfessional | null>;
  getByFingerprint(organizationId: string, fingerprint: string): Promise<StoredProfessional | null>;
  upsert(row: StoredProfessional): Promise<StoredProfessional>;
  indicators(organizationId: string): Promise<ProfessionalIndicators>;
  listByTender(organizationId: string, tenderId: string): Promise<StoredProfessional[]>;
}

export interface DocumentStorage {
  configured(): boolean;
  upload(path: string, bytes: Buffer, contentType: string): Promise<void>;
  download(path: string): Promise<Buffer>;
  remove(path: string): Promise<void>;
}
