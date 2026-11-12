import type {
  DuplicateAction,
  ImportAnalysis,
  ImportIssue,
  ImportPreviewRow,
  ProfessionalCertification,
  ProfessionalEducation,
  ProfessionalExperience,
  ProfessionalLicense,
  ProfessionalRecord,
  ProfessionalSkill,
  VerificationStatus,
} from "./contracts";
import { fullName, identityHash, maskEmail, maskPhone, newId } from "./pii";
import { bogotaToday, mergeRanges, monthsBetween } from "./overlap";
import { rowObject, sheetByName, suggestMapping, type SheetTable } from "./sheets";

export interface DraftRecord {
  externalId: string;
  identityKey: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  professional: Record<string, string>;
  education: Record<string, string>[];
  experiences: Record<string, string>[];
  certifications: Record<string, string>[];
  skills: Record<string, string>[];
  licenses: Record<string, string>[];
  existingId: string | null;
  action: ImportPreviewRow["action"];
}

export interface ParsedImport extends ImportAnalysis {
  records: DraftRecord[];
}

function issue(
  sheet: string,
  row: number,
  field: string,
  value: string,
  error: string,
  action: string,
  severity: ImportIssue["severity"] = "error",
): ImportIssue {
  return { id: newId(), sheet, row, field, value, error, action, severity };
}

function cell(data: Record<string, string>, key: string, fallback = ""): string {
  return data[key] ?? fallback;
}

export function analyzeImport(
  organizationId: string,
  sheets: SheetTable[],
  existing: ProfessionalRecord[],
  mappingOverride?: Record<string, string>,
  duplicateAction: DuplicateAction = "revisar",
): ParsedImport {
  const professionalsSheet = sheetByName(sheets, "Profesionales") ?? sheets.find((s) => normalizeIgnored(s.name) !== "instrucciones");
  if (!professionalsSheet) {
    return emptyResult(suggestMapping([]));
  }
  const mapping = { ...suggestMapping(professionalsSheet.headers), ...mappingOverride };
  const byExternal = new Map(existing.map((item) => [item.professional.externalId, item]));
  const grouped = new Map<string, DraftRecord>();
  const issues: ImportIssue[] = [];
  let rowNumber = 1;
  for (const row of professionalsSheet.rows) {
    rowNumber += 1;
    if (row.every((value) => !value.trim())) continue;
    const data = rowObject(professionalsSheet.headers, row, mapping);
    const externalId = data.externalId || data.fullName || `row-${rowNumber}`;
    if (!data.givenName && data.fullName) {
      const parts = data.fullName.split(" ");
      data.familyName = data.familyName || parts.slice(-1).join(" ");
      data.givenName = parts.slice(0, -1).join(" ") || data.fullName;
    }
    if (!data.givenName || !data.familyName) {
      issues.push(
        issue(
          professionalsSheet.name,
          rowNumber,
          "nombre",
          data.fullName ?? "",
          "Nombres y apellidos son obligatorios",
          "Completar la fila",
        ),
      );
      continue;
    }
    const identityKey = data.documentNumber
      ? identityHash(organizationId, data.documentType || "CC", data.documentNumber)
      : `ext:${externalId.toLocaleLowerCase("es-CO")}`;
    const match =
      byExternal.get(externalId) ??
      existing.find((item) => item.professional.fullName.toLocaleLowerCase("es-CO") === fullName(data.givenName, data.middleName ?? "", data.familyName).toLocaleLowerCase("es-CO") && item.professional.documentType === (data.documentType || "CC"));
    const action: ImportPreviewRow["action"] =
      match && duplicateAction === "omitir"
        ? "omitir"
        : match && duplicateAction === "actualizar"
          ? "actualizar"
          : match
            ? "revisar"
            : "crear";
    grouped.set(externalId, {
      externalId,
      identityKey,
      documentNumber: data.documentNumber,
      email: data.email,
      phone: data.phone,
      professional: data,
      education: [],
      experiences: [],
      certifications: [],
      skills: [],
      licenses: [],
      existingId: match?.professional.id ?? null,
      action,
    });
  }

  collect(sheets, "Formación", grouped, "education", issues, ["title", "level"]);
  collect(sheets, "Experiencias", grouped, "experiences", issues, ["client", "role", "startedOn"]);
  collect(sheets, "Certificaciones", grouped, "certifications", issues, ["name"]);
  collect(sheets, "Competencias", grouped, "skills", issues, ["name"]);
  collect(sheets, "Acreditaciones", grouped, "licenses", issues, ["kind", "issuer"]);

  const records = [...grouped.values()];
  const preview: ImportPreviewRow[] = records.map((item) => ({
    externalId: item.externalId,
    fullName: fullName(
      item.professional.givenName ?? "",
      item.professional.middleName ?? "",
      item.professional.familyName ?? "",
    ),
    action: item.action,
    existingId: item.existingId,
    education: item.education.length,
    experiences: item.experiences.length,
    certifications: item.certifications.length,
    issues: issues.filter((entry) => entry.value.includes(item.externalId)).length,
  }));

  return {
    mapping,
    records,
    issues,
    preview,
    sheets: sheets
      .filter((sheet) => normalizeIgnored(sheet.name) !== "instrucciones")
      .map((sheet) => ({ name: sheet.name, headers: sheet.headers, rows: sheet.rows.length })),
    stats: {
      rows: records.length,
      created: records.filter((item) => item.action === "crear").length,
      updated: records.filter((item) => item.action === "actualizar" || item.action === "revisar").length,
      skipped: records.filter((item) => item.action === "omitir").length,
      errors: issues.filter((item) => item.severity === "error").length,
      education: records.reduce((sum, item) => sum + item.education.length, 0),
      experiences: records.reduce((sum, item) => sum + item.experiences.length, 0),
      certifications: records.reduce((sum, item) => sum + item.certifications.length, 0),
      duplicates: records.filter((item) => item.existingId).length,
    },
  };
}

function normalizeIgnored(name: string): string {
  return name.trim().toLocaleLowerCase("es-CO");
}

function collect(
  sheets: SheetTable[],
  name: string,
  grouped: Map<string, DraftRecord>,
  key: "education" | "experiences" | "certifications" | "skills" | "licenses",
  issues: ImportIssue[],
  required: string[],
) {
  const sheet = sheetByName(sheets, name);
  if (!sheet) return;
  const mapping = suggestMapping(sheet.headers);
  let rowNumber = 1;
  for (const row of sheet.rows) {
    rowNumber += 1;
    if (row.every((value) => !value.trim())) continue;
    const data = rowObject(sheet.headers, row, mapping);
    const parent = grouped.get(cell(data, "externalId"));
    if (!parent) {
      issues.push(
        issue(name, rowNumber, "externalId", data.externalId ?? "", "No hay profesional con ese ID externo", "Alinear identificadores"),
      );
      continue;
    }
    const missing = required.filter((field) => !data[field]);
    if (missing.length) {
      issues.push(
        issue(name, rowNumber, missing[0]!, JSON.stringify(data), `Falta ${missing.join(", ")}`, "Completar campos obligatorios"),
      );
      continue;
    }
    parent[key].push(data);
  }
}

function emptyResult(mapping: Record<string, string>): ParsedImport {
  return {
    mapping,
    records: [],
    issues: [],
    preview: [],
    sheets: [],
    stats: {
      rows: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      education: 0,
      experiences: 0,
      certifications: 0,
      duplicates: 0,
    },
  };
}

export function materializeDraft(
  organizationId: string,
  actorName: string,
  draft: DraftRecord,
  existing: ProfessionalRecord | null,
  now = new Date().toISOString(),
): {
  record: ProfessionalRecord;
  secrets: { documentNumber: string | null; email: string | null; phone: string | null; fingerprint: string | null };
} {
  const professionalId = existing?.professional.id ?? newId();
  const name = fullName(
    cell(draft.professional, "givenName"),
    cell(draft.professional, "middleName"),
    cell(draft.professional, "familyName"),
  );
  const education: ProfessionalEducation[] = draft.education.map((item) => ({
    id: newId(),
    externalId: cell(item, "recordExternalId", cell(item, "title")),
    level: (cell(item, "level", "profesional") as ProfessionalEducation["level"]) || "profesional",
    title: cell(item, "title"),
    institution: cell(item, "institution"),
    country: cell(item, "country", "CO"),
    startedOn: cell(item, "startedOn") || null,
    graduatedOn: cell(item, "graduatedOn") || null,
    status: (cell(item, "status", "graduado") as ProfessionalEducation["status"]) || "graduado",
    supportRef: cell(item, "supportRef") || null,
    verification: (cell(item, "supportRef") ? "pendiente" : "incompleto") as VerificationStatus,
  }));
  const today = bogotaToday();
  const experiences: ProfessionalExperience[] = draft.experiences.map((item) => {
    const startedOn = cell(item, "startedOn");
    const endedOn = cell(item, "endedOn") || null;
    return {
      id: newId(),
      externalId: cell(item, "recordExternalId", `${cell(item, "client")}-${cell(item, "role")}`),
      client: cell(item, "client"),
      employer: cell(item, "employer", cell(item, "client")),
      project: cell(item, "project", cell(item, "client")),
      role: cell(item, "role"),
      startedOn,
      endedOn,
      current: !endedOn,
      functions: cell(item, "functions"),
      activities: cell(item, "activities")
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean),
      technologies: cell(item, "technologies")
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean),
      sector: cell(item, "sector"),
      projectType: cell(item, "projectType"),
      contractObject: cell(item, "contractObject"),
      supportRef: cell(item, "supportRef") || null,
      verification: (cell(item, "supportRef") ? "pendiente" : "incompleto") as VerificationStatus,
      monthsVerified: monthsBetween(startedOn, endedOn || today),
    };
  });
  const certifications: ProfessionalCertification[] = draft.certifications.map((item) => {
    const expiresOn = cell(item, "expiresOn") || null;
    const validity: ProfessionalCertification["validity"] = !expiresOn
      ? "sin_fecha"
      : expiresOn < today
        ? "vencida"
        : "vigente";
    return {
      id: newId(),
      externalId: cell(item, "recordExternalId", cell(item, "name")),
      name: cell(item, "name"),
      issuer: cell(item, "issuer"),
      credentialCode: cell(item, "credentialCode"),
      issuedOn: cell(item, "issuedOn") || null,
      expiresOn,
      verificationUrl: cell(item, "verificationUrl") || null,
      category: cell(item, "category"),
      supportRef: cell(item, "supportRef") || null,
      validity,
      verification: (cell(item, "supportRef") ? "pendiente" : "incompleto") as VerificationStatus,
    };
  });
  const licenses: ProfessionalLicense[] = draft.licenses.map((item) => ({
    id: newId(),
    externalId: cell(item, "recordExternalId", cell(item, "number", cell(item, "kind"))),
    kind: (cell(item, "kind", "matricula") as ProfessionalLicense["kind"]) || "matricula",
    issuer: cell(item, "issuer"),
    number: cell(item, "number"),
    profession: cell(item, "profession", cell(draft.professional, "profession")),
    issuedOn: cell(item, "issuedOn") || null,
    status: cell(item, "supportRef") ? "pendiente" : "sin_confirmar",
    supportRef: cell(item, "supportRef") || null,
    verification: "pendiente",
  }));
  const skills: ProfessionalSkill[] = draft.skills.map((item) => ({
    id: newId(),
    name: cell(item, "name"),
    category: cell(item, "category"),
    level: (cell(item, "level", "intermedio") as ProfessionalSkill["level"]) || "intermedio",
  }));

  const months = mergeRanges(
    experiences.map((item) => ({ start: item.startedOn, end: item.endedOn })),
    today,
  ).months;
  const documentNumber = draft.documentNumber || null;
  const email = draft.email || null;
  const phone = draft.phone || null;

  return {
    record: {
      professional: {
        id: professionalId,
        organizationId,
        externalId: draft.externalId,
        givenName: cell(draft.professional, "givenName"),
        middleName: cell(draft.professional, "middleName"),
        familyName: cell(draft.professional, "familyName"),
        fullName: name,
        documentType: draft.professional.documentType || "CC",
        documentNumberMasked: documentNumber ? maskLater(documentNumber) : existing?.professional.documentNumberMasked ?? "",
        profession: draft.professional.profession ?? "",
        specialty: draft.professional.specialty ?? "",
        primaryProfile: draft.professional.primaryProfile ?? draft.professional.profession ?? "",
        city: draft.professional.city ?? "",
        department: draft.professional.department ?? "",
        country: "CO",
        linkage: (draft.professional.linkage as ProfessionalRecord["professional"]["linkage"]) || "empleado",
        availability: (draft.professional.availability as ProfessionalRecord["professional"]["availability"]) || "disponible",
        status: (draft.professional.status as ProfessionalRecord["professional"]["status"]) || "activo",
        verification: existing?.professional.verification ?? "pendiente",
        incomplete: !education.length || experiences.some((item) => !item.supportRef),
        notes: existing?.professional.notes ?? "",
        generalExperienceMonths: months,
        yearsGeneral: Math.round(months / 12),
        emailMasked: email ? maskEmail(email) : existing?.professional.emailMasked,
        phoneMasked: phone ? maskPhone(phone) : existing?.professional.phoneMasked,
        certificationCount: certifications.length,
        createdAt: existing?.professional.createdAt ?? now,
        updatedAt: now,
        createdBy: existing?.professional.createdBy ?? actorName,
      },
      education: mergeVerified(existing?.education ?? [], education),
      experiences: mergeVerified(existing?.experiences ?? [], experiences),
      certifications: mergeVerified(existing?.certifications ?? [], certifications),
      licenses: mergeVerified(existing?.licenses ?? [], licenses),
      skills,
      attachments: existing?.attachments ?? [],
      consent: existing?.consent ?? null,
      generatedResumes: existing?.generatedResumes ?? [],
      tenderAssignments: existing?.tenderAssignments ?? [],
    },
    secrets: {
      documentNumber,
      email,
      phone,
      fingerprint: documentNumber
        ? identityHash(organizationId, draft.professional.documentType || "CC", documentNumber)
        : null,
    },
  };
}

function maskLater(value: string): string {
  return value.length <= 4 ? "****" : `****${value.slice(-4)}`;
}

function mergeVerified<T extends { externalId: string; verification: string }>(current: T[], incoming: T[]): T[] {
  const kept = current.filter((item) => item.verification === "verificado");
  const keptIds = new Set(kept.map((item) => item.externalId));
  return [...kept, ...incoming.filter((item) => !keptIds.has(item.externalId))];
}
