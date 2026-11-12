import "server-only";
import postgres from "postgres";
import { serverEnv } from "@/env.server";
import { PerfilesError } from "./errors";
import type { ProfessionalIndicators } from "./contracts";
import type { ProfessionalRepository } from "./repository";
import { computeIndicators, type StoredProfessional } from "./stored";

const globalForPerfiles = globalThis as unknown as {
  perfilesSql?: ReturnType<typeof postgres>;
};

function getSql() {
  if (!serverEnv.DATABASE_URL) {
    throw new PerfilesError(
      503,
      "perfiles_db_unconfigured",
      "DATABASE_URL no está configurado. El banco de perfiles persiste en Supabase PostgreSQL.",
    );
  }
  if (!globalForPerfiles.perfilesSql) {
    globalForPerfiles.perfilesSql = postgres(serverEnv.DATABASE_URL, { prepare: false, max: 4 });
  }
  return globalForPerfiles.perfilesSql;
}

interface DbRow {
  id: string;
  organization_id: string;
  external_id: string | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  document_type: string;
  document_number: string | null;
  identity_fingerprint: string | null;
  email: string | null;
  phone: string | null;
  profession: string;
  primary_profile: string;
  specialty: string;
  city: string;
  department: string;
  country: string;
  general_experience_months: number;
  availability: StoredProfessional["availability"];
  verification_status: StoredProfessional["verificationStatus"];
  status: StoredProfessional["status"];
  education: StoredProfessional["education"];
  experiences: StoredProfessional["experiences"];
  certifications: StoredProfessional["certifications"];
  licenses: StoredProfessional["licenses"];
  skills: StoredProfessional["skills"];
  attachments: StoredProfessional["attachments"];
  consent: StoredProfessional["consent"];
  generated_resumes: StoredProfessional["generatedResumes"];
  tender_assignments: StoredProfessional["tenderAssignments"];
  notes: string;
  linkage: StoredProfessional["linkage"];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

function mapRow(row: DbRow): StoredProfessional {
  return {
    id: row.id,
    organizationId: row.organization_id,
    externalId: row.external_id,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    fullName: row.full_name,
    documentType: row.document_type,
    documentNumber: row.document_number,
    identityFingerprint: row.identity_fingerprint,
    email: row.email,
    phone: row.phone,
    profession: row.profession,
    primaryProfile: row.primary_profile,
    specialty: row.specialty,
    city: row.city,
    department: row.department,
    country: row.country,
    generalExperienceMonths: Number(row.general_experience_months) || 0,
    availability: row.availability,
    verificationStatus: row.verification_status,
    status: row.status,
    education: row.education ?? [],
    experiences: row.experiences ?? [],
    certifications: row.certifications ?? [],
    licenses: row.licenses ?? [],
    skills: row.skills ?? [],
    attachments: row.attachments ?? [],
    consent: row.consent ?? null,
    generatedResumes: row.generated_resumes ?? [],
    tenderAssignments: row.tender_assignments ?? [],
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    linkage: row.linkage ?? "empleado",
  };
}

function jsonb(value: unknown) {
  return getSql().json(JSON.parse(JSON.stringify(value)) as Parameters<ReturnType<typeof getSql>["json"]>[0]);
}

function like(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? `%${trimmed}%` : null;
}

export function createSqlRepository(): ProfessionalRepository {
  return {
    async tableExists() {
      const sql = getSql();
      const rows = await sql<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'professional_profiles'
        ) AS exists
      `;
      return Boolean(rows[0]?.exists);
    },

    async list(organizationId, filters, page, pageSize) {
      const sql = getSql();
      await assertTable();
      const offset = (page - 1) * pageSize;
      const search = like(filters.search);
      const profession = like(filters.profession);
      const profile = like(filters.profile);
      const specialty = like(filters.specialty);
      const city = filters.city?.trim() || null;
      const availability = filters.availability ?? null;
      const status = filters.status ?? null;
      const verification = filters.verification ?? null;
      const minMonths = filters.minYears ? filters.minYears * 12 : null;
      const certification = like(filters.certification);
      const technology = like(filters.technology);
      const where = sql`
        organization_id = ${organizationId}
        AND (${search}::text IS NULL OR (
          full_name ILIKE ${search}
          OR profession ILIKE ${search}
          OR primary_profile ILIKE ${search}
          OR specialty ILIKE ${search}
          OR city ILIKE ${search}
          OR education::text ILIKE ${search}
          OR experiences::text ILIKE ${search}
          OR certifications::text ILIKE ${search}
          OR skills::text ILIKE ${search}
          OR licenses::text ILIKE ${search}
        ))
        AND (${profession}::text IS NULL OR profession ILIKE ${profession})
        AND (${profile}::text IS NULL OR primary_profile ILIKE ${profile})
        AND (${specialty}::text IS NULL OR specialty ILIKE ${specialty})
        AND (${city}::text IS NULL OR city = ${city})
        AND (${availability}::text IS NULL OR availability = ${availability})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${verification}::text IS NULL OR verification_status = ${verification})
        AND (${minMonths}::int IS NULL OR general_experience_months >= ${minMonths})
        AND (${certification}::text IS NULL OR certifications::text ILIKE ${certification})
        AND (${technology}::text IS NULL OR experiences::text ILIKE ${technology} OR skills::text ILIKE ${technology})
      `;
      const order =
        filters.sort === "full_name"
          ? sql`lower(full_name) ASC, updated_at DESC`
          : filters.sort === "experiencia"
            ? sql`general_experience_months DESC, updated_at DESC`
            : sql`updated_at DESC`;
      const [countRows, items] = await Promise.all([
        sql<{ total: string }[]>`SELECT count(*)::text AS total FROM professional_profiles WHERE ${where}`,
        sql<DbRow[]>`
          SELECT * FROM professional_profiles
          WHERE ${where}
          ORDER BY ${order}
          LIMIT ${pageSize} OFFSET ${offset}
        `,
      ]);
      return { items: items.map(mapRow), total: Number(countRows[0]?.total ?? 0) };
    },

    async listAll(organizationId) {
      const sql = getSql();
      await assertTable();
      const items = await sql<DbRow[]>`
        SELECT * FROM professional_profiles
        WHERE organization_id = ${organizationId}
        ORDER BY updated_at DESC
      `;
      return items.map(mapRow);
    },

    async get(organizationId, id) {
      const sql = getSql();
      await assertTable();
      const items = await sql<DbRow[]>`
        SELECT * FROM professional_profiles
        WHERE organization_id = ${organizationId} AND id = ${id}
        LIMIT 1
      `;
      return items[0] ? mapRow(items[0]) : null;
    },

    async getByExternalId(organizationId, externalId) {
      const sql = getSql();
      await assertTable();
      const items = await sql<DbRow[]>`
        SELECT * FROM professional_profiles
        WHERE organization_id = ${organizationId} AND external_id = ${externalId}
        LIMIT 1
      `;
      return items[0] ? mapRow(items[0]) : null;
    },

    async getByFingerprint(organizationId, fingerprint) {
      const sql = getSql();
      await assertTable();
      const items = await sql<DbRow[]>`
        SELECT * FROM professional_profiles
        WHERE organization_id = ${organizationId} AND identity_fingerprint = ${fingerprint}
        LIMIT 1
      `;
      return items[0] ? mapRow(items[0]) : null;
    },

    async upsert(row) {
      const sql = getSql();
      await assertTable();
      const items = await sql<DbRow[]>`
        INSERT INTO professional_profiles (
          id, organization_id, external_id, first_name, middle_name, last_name, full_name,
          document_type, document_number, identity_fingerprint, email, phone, profession,
          primary_profile, specialty, city, department, country, general_experience_months,
          availability, verification_status, status, education, experiences, certifications,
          licenses, skills, attachments, consent, generated_resumes, tender_assignments,
          notes, linkage, created_at, updated_at, created_by, updated_by
        ) VALUES (
          ${row.id}, ${row.organizationId}, ${row.externalId}, ${row.firstName}, ${row.middleName},
          ${row.lastName}, ${row.fullName}, ${row.documentType}, ${row.documentNumber},
          ${row.identityFingerprint}, ${row.email}, ${row.phone}, ${row.profession},
          ${row.primaryProfile}, ${row.specialty}, ${row.city}, ${row.department}, ${row.country},
          ${row.generalExperienceMonths}, ${row.availability}, ${row.verificationStatus}, ${row.status},
          ${jsonb(row.education)}, ${jsonb(row.experiences)}, ${jsonb(row.certifications)},
          ${jsonb(row.licenses)}, ${jsonb(row.skills)}, ${jsonb(row.attachments)},
          ${row.consent ? jsonb(row.consent) : null}, ${jsonb(row.generatedResumes)},
          ${jsonb(row.tenderAssignments)}, ${row.notes}, ${row.linkage}, ${row.createdAt}, ${row.updatedAt},
          ${row.createdBy}, ${row.updatedBy}
        )
        ON CONFLICT (id) DO UPDATE SET
          external_id = EXCLUDED.external_id,
          first_name = EXCLUDED.first_name,
          middle_name = EXCLUDED.middle_name,
          last_name = EXCLUDED.last_name,
          full_name = EXCLUDED.full_name,
          document_type = EXCLUDED.document_type,
          document_number = COALESCE(EXCLUDED.document_number, professional_profiles.document_number),
          identity_fingerprint = COALESCE(EXCLUDED.identity_fingerprint, professional_profiles.identity_fingerprint),
          email = COALESCE(EXCLUDED.email, professional_profiles.email),
          phone = COALESCE(EXCLUDED.phone, professional_profiles.phone),
          profession = EXCLUDED.profession,
          primary_profile = EXCLUDED.primary_profile,
          specialty = EXCLUDED.specialty,
          city = EXCLUDED.city,
          department = EXCLUDED.department,
          country = EXCLUDED.country,
          general_experience_months = EXCLUDED.general_experience_months,
          availability = EXCLUDED.availability,
          verification_status = EXCLUDED.verification_status,
          status = EXCLUDED.status,
          education = EXCLUDED.education,
          experiences = EXCLUDED.experiences,
          certifications = EXCLUDED.certifications,
          licenses = EXCLUDED.licenses,
          skills = EXCLUDED.skills,
          attachments = EXCLUDED.attachments,
          consent = EXCLUDED.consent,
          generated_resumes = EXCLUDED.generated_resumes,
          tender_assignments = EXCLUDED.tender_assignments,
          notes = EXCLUDED.notes,
          linkage = EXCLUDED.linkage,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by
        RETURNING *
      `;
      return mapRow(items[0]!);
    },

    async indicators(organizationId): Promise<ProfessionalIndicators> {
      const all = await this.listAll(organizationId);
      return computeIndicators(all);
    },

    async listByTender(organizationId, tenderId) {
      const sql = getSql();
      await assertTable();
      const items = await sql<DbRow[]>`
        SELECT * FROM professional_profiles
        WHERE organization_id = ${organizationId}
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements(tender_assignments) AS elem
            WHERE elem->>'tenderId' = ${tenderId}
          )
      `;
      return items
        .map(mapRow)
        .filter((item) =>
          item.tenderAssignments.some((assignment) => assignment.tenderId === tenderId && assignment.status !== "retirado"),
        );
    },
  };
}

let tableChecked = false;

async function assertTable() {
  if (tableChecked) return;
  const sql = getSql();
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'professional_profiles'
    ) AS exists
  `;
  if (!rows[0]?.exists) {
    throw new PerfilesError(
      503,
      "perfiles_table_missing",
      "La tabla public.professional_profiles no existe en Supabase. Ejecute supabase/migrations/20261112_professional_profiles.sql en el SQL Editor.",
    );
  }
  tableChecked = true;
}
