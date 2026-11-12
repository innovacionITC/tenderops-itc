import { canApprove, canFollow, type AppRole } from "@/lib/auth/roles";
import type {
  DuplicateAction,
  GeneratedResume,
  ImportAnalysis,
  ProfessionalAttachment,
  ProfessionalCertification,
  ProfessionalConsent,
  ProfessionalEducation,
  ProfessionalExperience,
  ProfessionalFilters,
  ProfessionalLicense,
  ProfessionalRecord,
  ProfessionalSkill,
  ProfessionalWriteInput,
  ResumeFormat,
  ResumeSelection,
  TenderAssignment,
  TenderStaffRole,
} from "./contracts";
import { buildResumeDocx, hashBuffer } from "./docx";
import { applyEntityTemplate } from "./entity-template";
import { PerfilesError } from "./errors";
import { analyzeImport, materializeDraft } from "./import-engine";
import { matchProfessionalToRole, orderExperiences } from "./matching";
import { bogotaToday, mergeRanges } from "./overlap";
import { fullName, identityHash, newId } from "./pii";
import type { DocumentStorage, ProfessionalRepository } from "./repository";
import { isIncomplete, toPublicRecord, type StoredProfessional } from "./stored";
import { buildResumePreview } from "./preview";
import { readWorkbook } from "./template-excel";

export interface PerfilesActor {
  userId: string;
  email: string | null;
  role: AppRole | null;
  activeOrganizationId: string;
}

export interface ProfessionalService {
  indicators(auth: PerfilesActor): Promise<import("./contracts").ProfessionalIndicators>;
  list(
    auth: PerfilesActor,
    filters: ProfessionalFilters,
    page: number,
    pageSize: number,
  ): Promise<{ items: ProfessionalRecord["professional"][]; total: number; page: number; pageSize: number }>;
  get(auth: PerfilesActor, id: string): Promise<ProfessionalRecord>;
  save(auth: PerfilesActor, input: ProfessionalWriteInput, id?: string): Promise<ProfessionalRecord["professional"]>;
  deactivate(auth: PerfilesActor, id: string): Promise<ProfessionalRecord["professional"]>;
  saveEducation(auth: PerfilesActor, id: string, items: ProfessionalEducation[]): Promise<ProfessionalRecord>;
  saveExperiences(auth: PerfilesActor, id: string, items: ProfessionalExperience[]): Promise<ProfessionalRecord>;
  saveCertifications(auth: PerfilesActor, id: string, items: ProfessionalCertification[]): Promise<ProfessionalRecord>;
  saveLicenses(auth: PerfilesActor, id: string, items: ProfessionalLicense[]): Promise<ProfessionalRecord>;
  saveSkills(auth: PerfilesActor, id: string, items: ProfessionalSkill[]): Promise<ProfessionalRecord>;
  saveConsent(auth: PerfilesActor, id: string, input: Partial<ProfessionalConsent>): Promise<ProfessionalConsent>;
  addAttachment(
    auth: PerfilesActor,
    id: string,
    file: { name: string; bytes: Buffer; contentType: string; kind: ProfessionalAttachment["kind"]; relatedRecordId?: string },
  ): Promise<ProfessionalAttachment>;
  analyzeExcel(auth: PerfilesActor, file: Buffer, mapping?: Record<string, string>, duplicateAction?: DuplicateAction): Promise<ImportAnalysis>;
  commitExcel(
    auth: PerfilesActor,
    file: Buffer,
    mapping: Record<string, string>,
    duplicateAction: DuplicateAction,
  ): Promise<ImportAnalysis>;
  generateResume(
    auth: PerfilesActor,
    input: {
      professionalId: string;
      proposedRoleName: string;
      tenderId?: string | null;
      tenderLabel?: string | null;
      role?: Partial<TenderStaffRole> | null;
      selection: ResumeSelection;
      format: ResumeFormat;
    },
  ): Promise<{ resume: GeneratedResume; warnings: string[] }>;
  downloadResume(auth: PerfilesActor, professionalId: string, resumeId: string): Promise<{ bytes: Buffer; fileName: string }>;
  approveResume(auth: PerfilesActor, professionalId: string, resumeId: string): Promise<GeneratedResume>;
  regenerateResume(auth: PerfilesActor, professionalId: string, resumeId: string): Promise<{ resume: GeneratedResume; warnings: string[] }>;
  assignToTender(
    auth: PerfilesActor,
    professionalId: string,
    tender: { id: string; label: string },
    role: TenderStaffRole,
  ): Promise<TenderAssignment>;
  listTenderTeam(auth: PerfilesActor, tenderId: string): Promise<ProfessionalRecord[]>;
  previewResumeHtml(record: ProfessionalRecord, selection: ResumeSelection, proposedRoleName: string, processLabel: string): string;
  saveEntityTemplate(auth: PerfilesActor, bytes: Buffer): Promise<{ path: string }>;
}

function requireWrite(auth: PerfilesActor) {
  if (!canFollow(auth.role)) {
    throw new PerfilesError(403, "forbidden", "No tiene permiso para modificar el banco de perfiles.");
  }
}

function requireApprove(auth: PerfilesActor) {
  if (!canApprove(auth.role)) {
    throw new PerfilesError(403, "forbidden", "Solo un director o administrador puede aprobar una hoja de vida.");
  }
}

function recalc(row: StoredProfessional): StoredProfessional {
  const months = mergeRanges(
    row.experiences.map((item) => ({ start: item.startedOn, end: item.endedOn })),
    bogotaToday(),
  ).months;
  return {
    ...row,
    generalExperienceMonths: months,
    verificationStatus: isIncomplete(row) ? (row.verificationStatus === "verificado" ? "verificado" : "incompleto") : row.verificationStatus,
    updatedAt: new Date().toISOString(),
  };
}

function fromRecord(
  record: ProfessionalRecord,
  secrets: { documentNumber: string | null; email: string | null; phone: string | null; fingerprint: string | null },
  existing?: StoredProfessional | null,
): StoredProfessional {
  const p = record.professional;
  return recalc({
    id: p.id,
    organizationId: p.organizationId,
    externalId: p.externalId,
    firstName: p.givenName,
    middleName: p.middleName,
    lastName: p.familyName,
    fullName: p.fullName,
    documentType: p.documentType,
    documentNumber: secrets.documentNumber ?? existing?.documentNumber ?? null,
    identityFingerprint: secrets.fingerprint ?? existing?.identityFingerprint ?? null,
    email: secrets.email ?? existing?.email ?? null,
    phone: secrets.phone ?? existing?.phone ?? null,
    profession: p.profession,
    primaryProfile: p.primaryProfile,
    specialty: p.specialty,
    city: p.city,
    department: p.department,
    country: p.country,
    generalExperienceMonths: p.generalExperienceMonths,
    availability: p.availability,
    verificationStatus: p.verification,
    status: p.status,
    education: record.education,
    experiences: record.experiences,
    certifications: record.certifications,
    licenses: record.licenses,
    skills: record.skills,
    attachments: record.attachments,
    consent: record.consent,
    generatedResumes: record.generatedResumes,
    tenderAssignments: record.tenderAssignments,
    notes: p.notes,
    createdAt: p.createdAt,
    updatedAt: new Date().toISOString(),
    createdBy: p.createdBy,
    updatedBy: existing?.updatedBy ?? p.createdBy,
    linkage: p.linkage,
  });
}

function assertOwned(record: ProfessionalRecord, selection: ResumeSelection) {
  const ids = [
    ...record.education.map((item) => item.id),
    ...record.experiences.map((item) => item.id),
    ...record.certifications.map((item) => item.id),
    ...record.licenses.map((item) => item.id),
    ...record.attachments.map((item) => item.id),
  ];
  const selected = [
    ...selection.educationIds,
    ...selection.experienceIds,
    ...selection.certificationIds,
    ...selection.licenseIds,
    ...selection.attachmentIds,
  ];
  if (selected.some((id) => !ids.includes(id))) {
    throw new PerfilesError(400, "invalid_resume_selection", "La selección incluye elementos que no pertenecen al profesional.");
  }
}

export function createProfessionalService(
  repo: ProfessionalRepository,
  storage: DocumentStorage,
): ProfessionalService {
  async function load(auth: PerfilesActor, id: string): Promise<StoredProfessional> {
    const row = await repo.get(auth.activeOrganizationId, id);
    if (!row) throw new PerfilesError(404, "not_found", "Profesional no encontrado en la organización activa.");
    return row;
  }

  return {
    async indicators(auth) {
      return repo.indicators(auth.activeOrganizationId);
    },

    async list(auth, filters, page, pageSize) {
      const result = await repo.list(auth.activeOrganizationId, filters, page, pageSize);
      return {
        items: result.items.map((row) => toPublicRecord(row).professional),
        total: result.total,
        page,
        pageSize,
      };
    },

    async get(auth, id) {
      return toPublicRecord(await load(auth, id));
    },

    async save(auth, input, id) {
      requireWrite(auth);
      const existing = id ? await load(auth, id) : null;
      if (id && !existing) throw new PerfilesError(404, "not_found", "Profesional no encontrado.");
      const professionalId = existing?.id ?? newId();
      const fingerprint = input.documentNumber
        ? identityHash(auth.activeOrganizationId, input.documentType || existing?.documentType || "CC", input.documentNumber)
        : existing?.identityFingerprint ?? null;
      if (fingerprint) {
        const clash = await repo.getByFingerprint(auth.activeOrganizationId, fingerprint);
        if (clash && clash.id !== professionalId) {
          throw new PerfilesError(409, "duplicate_identity", "Ya existe un profesional con ese documento en la organización.");
        }
      }
      const given = input.givenName.trim();
      const family = input.familyName.trim();
      if (!given || !family) {
        throw new PerfilesError(400, "validation", "Nombres y apellidos son obligatorios.");
      }
      const now = new Date().toISOString();
      const row = recalc({
        id: professionalId,
        organizationId: auth.activeOrganizationId,
        externalId: input.externalId?.trim() || existing?.externalId || professionalId,
        firstName: given,
        middleName: input.middleName?.trim() ?? existing?.middleName ?? "",
        lastName: family,
        fullName: fullName(given, input.middleName ?? existing?.middleName ?? "", family),
        documentType: input.documentType ?? existing?.documentType ?? "CC",
        documentNumber: input.documentNumber ?? existing?.documentNumber ?? null,
        identityFingerprint: fingerprint,
        email: input.email ?? existing?.email ?? null,
        phone: input.phone ?? existing?.phone ?? null,
        profession: input.profession ?? existing?.profession ?? "",
        primaryProfile: input.primaryProfile ?? existing?.primaryProfile ?? input.profession ?? "",
        specialty: input.specialty ?? existing?.specialty ?? "",
        city: input.city ?? existing?.city ?? "",
        department: input.department ?? existing?.department ?? "",
        country: input.country ?? existing?.country ?? "CO",
        generalExperienceMonths: existing?.generalExperienceMonths ?? 0,
        availability: input.availability ?? existing?.availability ?? "disponible",
        verificationStatus: existing?.verificationStatus ?? "pendiente",
        status: input.status ?? existing?.status ?? "activo",
        education: existing?.education ?? [],
        experiences: existing?.experiences ?? [],
        certifications: existing?.certifications ?? [],
        licenses: existing?.licenses ?? [],
        skills: existing?.skills ?? [],
        attachments: existing?.attachments ?? [],
        consent: existing?.consent ?? null,
        generatedResumes: existing?.generatedResumes ?? [],
        tenderAssignments: existing?.tenderAssignments ?? [],
        notes: input.notes ?? existing?.notes ?? "",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        createdBy: existing?.createdBy ?? auth.userId,
        updatedBy: auth.userId,
        linkage: input.linkage ?? existing?.linkage ?? "empleado",
      });
      const saved = await repo.upsert(row);
      return toPublicRecord(saved).professional;
    },

    async deactivate(auth, id) {
      requireWrite(auth);
      const row = await load(auth, id);
      const saved = await repo.upsert({
        ...row,
        status: "inactivo",
        updatedAt: new Date().toISOString(),
        updatedBy: auth.userId,
      });
      return toPublicRecord(saved).professional;
    },

    async saveEducation(auth, id, items) {
      requireWrite(auth);
      const row = await load(auth, id);
      return toPublicRecord(await repo.upsert(recalc({ ...row, education: items, updatedBy: auth.userId })));
    },
    async saveExperiences(auth, id, items) {
      requireWrite(auth);
      const row = await load(auth, id);
      return toPublicRecord(await repo.upsert(recalc({ ...row, experiences: items, updatedBy: auth.userId })));
    },
    async saveCertifications(auth, id, items) {
      requireWrite(auth);
      const row = await load(auth, id);
      const today = bogotaToday();
      const next = items.map((item) => ({
        ...item,
        validity: !item.expiresOn ? "sin_fecha" : item.expiresOn < today ? "vencida" : "vigente",
      })) as ProfessionalCertification[];
      return toPublicRecord(await repo.upsert(recalc({ ...row, certifications: next, updatedBy: auth.userId })));
    },
    async saveLicenses(auth, id, items) {
      requireWrite(auth);
      const row = await load(auth, id);
      return toPublicRecord(await repo.upsert(recalc({ ...row, licenses: items, updatedBy: auth.userId })));
    },
    async saveSkills(auth, id, items) {
      requireWrite(auth);
      const row = await load(auth, id);
      return toPublicRecord(await repo.upsert(recalc({ ...row, skills: items, updatedBy: auth.userId })));
    },

    async saveConsent(auth, id, input) {
      requireWrite(auth);
      const row = await load(auth, id);
      const consent: ProfessionalConsent = {
        id: row.consent?.id ?? newId(),
        store: input.store ?? row.consent?.store ?? false,
        consult: input.consult ?? row.consent?.consult ?? false,
        present: input.present ?? row.consent?.present ?? false,
        shareWithEntity: input.shareWithEntity ?? row.consent?.shareWithEntity ?? false,
        legalBasis: input.legalBasis ?? row.consent?.legalBasis ?? "Ley 1581 de 2012",
        grantedOn: input.grantedOn ?? row.consent?.grantedOn ?? new Date().toISOString(),
        evidenceRef: input.evidenceRef ?? row.consent?.evidenceRef ?? null,
      };
      await repo.upsert(recalc({ ...row, consent, updatedBy: auth.userId }));
      return consent;
    },

    async addAttachment(auth, id, file) {
      requireWrite(auth);
      const row = await load(auth, id);
      if (!storage.configured()) {
        throw new PerfilesError(503, "storage_unconfigured", "El API no pudo guardar el soporte en Storage.");
      }
      const attachmentId = newId();
      const path = `${auth.activeOrganizationId}/${id}/soportes/${attachmentId}-${file.name}`;
      await storage.upload(path, file.bytes, file.contentType);
      const attachment: ProfessionalAttachment = {
        id: attachmentId,
        kind: file.kind,
        name: file.name,
        storagePath: path,
        relatedRecordId: file.relatedRecordId ?? null,
        hash: hashBuffer(file.bytes),
        status: "asociado",
        createdAt: new Date().toISOString(),
      };
      await repo.upsert(
        recalc({ ...row, attachments: [...row.attachments, attachment], updatedBy: auth.userId }),
      );
      return attachment;
    },

    async analyzeExcel(auth, file, mapping, duplicateAction = "revisar") {
      requireWrite(auth);
      const sheets = await readWorkbook(file);
      const existing = (await repo.listAll(auth.activeOrganizationId)).map(toPublicRecord);
      const parsed = analyzeImport(auth.activeOrganizationId, sheets, existing, mapping, duplicateAction);
      return {
        mapping: parsed.mapping,
        sheets: parsed.sheets,
        preview: parsed.preview,
        issues: parsed.issues,
        stats: parsed.stats,
      };
    },

    async commitExcel(auth, file, mapping, duplicateAction) {
      requireWrite(auth);
      const sheets = await readWorkbook(file);
      const stored = await repo.listAll(auth.activeOrganizationId);
      const existing = stored.map(toPublicRecord);
      const parsed = analyzeImport(auth.activeOrganizationId, sheets, existing, mapping, duplicateAction);
      let created = 0;
      let updated = 0;
      let skipped = 0;
      for (const draft of parsed.records) {
        if (draft.action === "omitir" || (draft.existingId && duplicateAction === "conservar")) {
          skipped += 1;
          continue;
        }
        const currentStored = draft.existingId
          ? stored.find((item) => item.id === draft.existingId) ?? null
          : (await repo.getByExternalId(auth.activeOrganizationId, draft.externalId)) ??
            (draft.identityKey.startsWith("ext:")
              ? null
              : await repo.getByFingerprint(auth.activeOrganizationId, draft.identityKey));
        const current = currentStored ? toPublicRecord(currentStored) : null;
        const materialized = materializeDraft(
          auth.activeOrganizationId,
          auth.email ?? auth.userId,
          { ...draft, action: current ? "actualizar" : "crear" },
          current,
        );
        const row = fromRecord(materialized.record, materialized.secrets, currentStored);
        await repo.upsert({ ...row, updatedBy: auth.userId, createdBy: row.createdBy ?? auth.userId });
        if (current) updated += 1;
        else created += 1;
      }
      return {
        mapping: parsed.mapping,
        sheets: parsed.sheets,
        preview: parsed.preview,
        issues: parsed.issues,
        stats: { ...parsed.stats, created, updated, skipped },
      };
    },

    async generateResume(auth, input) {
      requireWrite(auth);
      const row = await load(auth, input.professionalId);
      const record = toPublicRecord(row);
      if (!record.consent?.present) {
        throw new PerfilesError(
          403,
          "consent_required",
          "No hay autorización de presentación (Ley 1581). Registre el consentimiento antes de generar la hoja de vida.",
        );
      }
      assertOwned(record, input.selection);
      const education = record.education.filter((item) => input.selection.educationIds.includes(item.id));
      const experiences = orderExperiences(
        record.experiences.filter((item) => input.selection.experienceIds.includes(item.id)),
        input.selection.experienceOrder,
        input.role?.specificCriteria ?? "",
      );
      const certifications = record.certifications.filter((item) => input.selection.certificationIds.includes(item.id));
      const licenses = record.licenses.filter((item) => input.selection.licenseIds.includes(item.id));
      const warnings: string[] = [];
      for (const item of certifications) {
        if (item.validity === "vencida") warnings.push(`Certificación vencida: ${item.name}`);
      }
      const selectedMonths = mergeRanges(
        experiences.map((item) => ({ start: item.startedOn, end: item.endedOn })),
        bogotaToday(),
      ).months;
      const now = new Date().toISOString();
      const family = row.generatedResumes.filter(
        (item) =>
          item.professionalId === row.id &&
          (item.tenderId ?? null) === (input.tenderId ?? null) &&
          item.proposedRoleName === input.proposedRoleName,
      );
      const version = family.reduce((max, item) => Math.max(max, item.version), 0) + 1;
      const resumeId = newId();
      const snapshot = {
        fullName: record.professional.fullName,
        proposedRoleName: input.proposedRoleName,
        profession: record.professional.profession,
        city: record.professional.city,
        summary: input.selection.summary,
        education,
        experiences,
        certifications,
        licenses,
        selectedExperienceMonths: selectedMonths,
      };
      const docxInput = {
        fullName: input.selection.includeName ? record.professional.fullName : "Profesional",
        proposedRole: input.proposedRoleName,
        profession: input.selection.includeProfession ? record.professional.profession : "",
        city: input.selection.includeCity ? record.professional.city : "",
        summary: input.selection.includeSummary ? input.selection.summary : "",
        processLabel: input.tenderLabel || input.tenderId || "Sin proceso asociado",
        generalMonths: selectedMonths,
        education,
        experiences,
        certifications,
        licenses,
      };
      let bytes = buildResumeDocx(docxInput);
      if (input.format === "entidad" && storage.configured()) {
        try {
          const template = await storage.download(`${auth.activeOrganizationId}/_templates/entidad.docx`);
          bytes = applyEntityTemplate(template, {
            variables: {
              "profesional.nombreCompleto": record.professional.fullName,
              "profesional.profesion": record.professional.profession,
              "perfil.cargoPropuesto": input.proposedRoleName,
              "proceso.identificador": input.tenderLabel || input.tenderId || "",
            },
            experiencias: experiences.map((item) => ({
              cargo: item.role,
              empresa: item.client,
              proyecto: item.project,
              inicio: item.startedOn,
              fin: item.endedOn ?? "actual",
              funciones: item.functions,
            })),
            estudios: education.map((item) => ({
              titulo: item.title,
              institucion: item.institution,
              grado: item.graduatedOn ?? "",
            })),
            certificaciones: certifications.map((item) => ({
              nombre: item.name,
              emisor: item.issuer,
            })),
            acreditaciones: licenses.map((item) => ({
              tipo: item.kind,
              entidad: item.issuer,
              numero: item.number,
            })),
          });
        } catch {
          warnings.push("No hay plantilla de entidad cargada; se usó la plantilla corporativa.");
          bytes = buildResumeDocx(docxInput);
        }
      }
      if (!storage.configured()) {
        throw new PerfilesError(
          503,
          "storage_unconfigured",
          "El API no pudo guardar el DOCX. Compruebe que tenderops-api tenga Storage y el bucket professional-documents.",
        );
      }
      const path = `${auth.activeOrganizationId}/${row.id}/hv/${resumeId}-v${version}.docx`;
      await storage.upload(
        path,
        bytes,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      const resume: GeneratedResume = {
        id: resumeId,
        professionalId: row.id,
        organizationId: auth.activeOrganizationId,
        tenderId: input.tenderId ?? null,
        tenderLabel: input.tenderLabel ?? null,
        proposedRoleName: input.proposedRoleName,
        templateId: input.format === "entidad" ? "entidad" : "corporativo",
        templateVersion: "1",
        format: input.format,
        version,
        status: "generado",
        storagePath: path,
        hash: hashBuffer(bytes),
        warnings,
        selection: input.selection,
        snapshot,
        createdAt: now,
        createdBy: auth.userId,
        createdByEmail: auth.email,
      };
      const generatedResumes = [resume, ...row.generatedResumes];
      await repo.upsert({ ...row, generatedResumes, updatedAt: now, updatedBy: auth.userId });
      return { resume, warnings };
    },

    async downloadResume(auth, professionalId, resumeId) {
      const row = await load(auth, professionalId);
      const resume = row.generatedResumes.find((item) => item.id === resumeId);
      if (!resume?.storagePath) throw new PerfilesError(404, "not_found", "Hoja de vida no encontrada.");
      const bytes = await storage.download(resume.storagePath);
      return {
        bytes,
        fileName: `HV-${row.fullName.replace(/\s+/g, "_")}-v${resume.version}.docx`,
      };
    },

    async approveResume(auth, professionalId, resumeId) {
      requireApprove(auth);
      const row = await load(auth, professionalId);
      const resume = row.generatedResumes.find((item) => item.id === resumeId);
      if (!resume) throw new PerfilesError(404, "not_found", "Hoja de vida no encontrada.");
      const next: GeneratedResume = { ...resume, status: "aprobado" };
      const generatedResumes = row.generatedResumes.map((item) => (item.id === resumeId ? next : item));
      await repo.upsert({ ...row, generatedResumes, updatedAt: new Date().toISOString(), updatedBy: auth.userId });
      return next;
    },

    async regenerateResume(auth, professionalId, resumeId) {
      requireWrite(auth);
      const row = await load(auth, professionalId);
      const resume = row.generatedResumes.find((item) => item.id === resumeId);
      if (!resume) throw new PerfilesError(404, "not_found", "Hoja de vida no encontrada.");
      if (resume.status !== "aprobado") {
        const generatedResumes = row.generatedResumes.map((item) =>
          item.id === resumeId ? { ...item, status: "obsoleto" as const } : item,
        );
        await repo.upsert({ ...row, generatedResumes, updatedBy: auth.userId });
      }
      return this.generateResume(auth, {
        professionalId,
        proposedRoleName: resume.proposedRoleName,
        tenderId: resume.tenderId,
        tenderLabel: resume.tenderLabel,
        selection: resume.selection,
        format: resume.format,
      });
    },

    async assignToTender(auth, professionalId, tender, role) {
      requireWrite(auth);
      const row = await load(auth, professionalId);
      const record = toPublicRecord(row);
      const match = matchProfessionalToRole(record, role, role.referenceDate || bogotaToday());
      const assignment: TenderAssignment = {
        id: newId(),
        tenderId: tender.id,
        tenderLabel: tender.label,
        roleName: role.name,
        role,
        match,
        status: "propuesto",
        resumeId: null,
        createdAt: new Date().toISOString(),
        createdBy: auth.userId,
      };
      const tenderAssignments = [
        assignment,
        ...row.tenderAssignments.filter(
          (item) => !(item.tenderId === tender.id && item.roleName === role.name && item.status !== "retirado"),
        ),
      ];
      await repo.upsert({
        ...row,
        tenderAssignments,
        availability: row.availability === "disponible" ? "asignado" : row.availability,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.userId,
      });
      return assignment;
    },

    async listTenderTeam(auth, tenderId) {
      const rows = await repo.listByTender(auth.activeOrganizationId, tenderId);
      return rows.map(toPublicRecord);
    },

    previewResumeHtml(record, selection, proposedRoleName, processLabel) {
      return buildResumePreview(record, selection, proposedRoleName, processLabel).html;
    },

    async saveEntityTemplate(auth, bytes) {
      requireWrite(auth);
      if (!storage.configured()) {
        throw new PerfilesError(503, "storage_unconfigured", "El API no pudo guardar la plantilla de entidad.");
      }
      const path = `${auth.activeOrganizationId}/_templates/entidad.docx`;
      await storage.upload(
        path,
        bytes,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      return { path };
    },
  };
}
