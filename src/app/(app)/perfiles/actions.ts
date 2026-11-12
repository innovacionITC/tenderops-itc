"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { PerfilesError } from "@/lib/perfiles/errors";
import { professionalService } from "@/lib/perfiles/server";
import { newId } from "@/lib/perfiles/ids";
import { getProcesoSeguimiento, listProcesosSeguimiento } from "@/lib/seguimiento";
import { ApiError } from "@/lib/api/client";
import type {
  DuplicateAction,
  ProfessionalAttachment,
  ProfessionalCertification,
  ProfessionalConsent,
  ProfessionalEducation,
  ProfessionalExperience,
  ProfessionalFilters,
  ProfessionalLicense,
  ProfessionalSkill,
  ProfessionalWriteInput,
  ResumeFormat,
  ResumeSelection,
  TenderStaffRole,
} from "@/lib/perfiles/contracts";

function fail(error: unknown): never {
  if (error instanceof PerfilesError) throw error;
  throw error;
}

function revalidate() {
  revalidatePath("/perfiles");
  revalidatePath("/seguimiento");
}

export async function listPerfilesAction(filters: ProfessionalFilters, page = 1, pageSize = 25) {
  const auth = await requireAuth();
  return professionalService().list(auth, filters, page, pageSize);
}

export async function getPerfilAction(id: string) {
  const auth = await requireAuth();
  return professionalService().get(auth, id);
}

export async function savePerfilAction(input: ProfessionalWriteInput, id?: string) {
  const auth = await requireAuth();
  try {
    const saved = await professionalService().save(auth, input, id);
    revalidate();
    return saved;
  } catch (error) {
    fail(error);
  }
}

export async function deactivatePerfilAction(id: string) {
  const auth = await requireAuth();
  const saved = await professionalService().deactivate(auth, id);
  revalidate();
  return saved;
}

export async function saveEducationAction(id: string, items: ProfessionalEducation[]) {
  const auth = await requireAuth();
  const record = await professionalService().saveEducation(auth, id, items);
  revalidate();
  return record;
}

export async function saveExperiencesAction(id: string, items: ProfessionalExperience[]) {
  const auth = await requireAuth();
  const record = await professionalService().saveExperiences(auth, id, items);
  revalidate();
  return record;
}

export async function saveCertificationsAction(id: string, items: ProfessionalCertification[]) {
  const auth = await requireAuth();
  const record = await professionalService().saveCertifications(auth, id, items);
  revalidate();
  return record;
}

export async function saveLicensesAction(id: string, items: ProfessionalLicense[]) {
  const auth = await requireAuth();
  const record = await professionalService().saveLicenses(auth, id, items);
  revalidate();
  return record;
}

export async function saveSkillsAction(id: string, items: ProfessionalSkill[]) {
  const auth = await requireAuth();
  const record = await professionalService().saveSkills(auth, id, items);
  revalidate();
  return record;
}

export async function saveConsentAction(id: string, input: Partial<ProfessionalConsent>) {
  const auth = await requireAuth();
  const consent = await professionalService().saveConsent(auth, id, input);
  revalidate();
  return consent;
}

export async function uploadAttachmentAction(formData: FormData) {
  const auth = await requireAuth();
  const id = String(formData.get("professionalId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || !id) {
    throw new PerfilesError(400, "validation", "Archivo y profesional son obligatorios.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = (String(formData.get("kind") ?? "otro") as ProfessionalAttachment["kind"]) || "otro";
  const relatedRecordId = String(formData.get("relatedRecordId") ?? "") || undefined;
  const attachment = await professionalService().addAttachment(auth, id, {
    name: file.name,
    bytes,
    contentType: file.type || "application/octet-stream",
    kind,
    relatedRecordId,
  });
  revalidate();
  return attachment;
}

export async function analyzeImportAction(formData: FormData) {
  const auth = await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new PerfilesError(400, "validation", "Seleccione un archivo .xlsx.");
  const mappingRaw = String(formData.get("mapping") ?? "");
  const mapping = mappingRaw ? (JSON.parse(mappingRaw) as Record<string, string>) : undefined;
  const duplicateAction = (String(formData.get("duplicateAction") ?? "revisar") as DuplicateAction) || "revisar";
  const bytes = Buffer.from(await file.arrayBuffer());
  return professionalService().analyzeExcel(auth, bytes, mapping, duplicateAction);
}

export async function commitImportAction(formData: FormData) {
  const auth = await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new PerfilesError(400, "validation", "Seleccione un archivo .xlsx.");
  const mapping = JSON.parse(String(formData.get("mapping") ?? "{}")) as Record<string, string>;
  const duplicateAction = (String(formData.get("duplicateAction") ?? "actualizar") as DuplicateAction) || "actualizar";
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await professionalService().commitExcel(auth, bytes, mapping, duplicateAction);
  revalidate();
  return result;
}

const generateSchema = z.object({
  professionalId: z.string().min(1),
  proposedRoleName: z.string().min(1),
  tenderId: z.string().min(1).nullable().optional(),
  tenderLabel: z.string().nullable().optional(),
  format: z.enum(["corporativo", "entidad"]),
  selection: z.custom<ResumeSelection>(),
});

export async function generateResumeAction(input: {
  professionalId: string;
  proposedRoleName: string;
  tenderId?: string | null;
  tenderLabel?: string | null;
  format: ResumeFormat;
  selection: ResumeSelection;
  role?: Partial<TenderStaffRole> | null;
}) {
  const auth = await requireAuth();
  let parsed: z.infer<typeof generateSchema>;
  try {
    parsed = generateSchema.parse(input);
  } catch {
    throw new PerfilesError(400, "validation", "Indique el profesional y el cargo a presentar.");
  }
  if (parsed.tenderId) {
    try {
      const proceso = await getProcesoSeguimiento(parsed.tenderId);
      parsed.tenderLabel = proceso.titulo ?? proceso.secopId ?? parsed.tenderId;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new PerfilesError(400, "tender_missing", "El proceso de seguimiento no existe. No se asocia una licitación ficticia.");
      }
      throw error;
    }
  }
  const result = await professionalService().generateResume(auth, { ...parsed, role: input.role });
  revalidate();
  return result.resume;
}

export async function approveResumeAction(professionalId: string, resumeId: string) {
  const auth = await requireAuth();
  const resume = await professionalService().approveResume(auth, professionalId, resumeId);
  revalidate();
  return resume;
}

export async function regenerateResumeAction(professionalId: string, resumeId: string) {
  const auth = await requireAuth();
  const result = await professionalService().regenerateResume(auth, professionalId, resumeId);
  revalidate();
  return result.resume;
}

export async function assignToProcessAction(input: {
  professionalId: string;
  tenderId: string;
  roleName: string;
  generalMonths?: number;
  specificMonths?: number;
  specificCriteria?: string;
  educationLevel?: TenderStaffRole["educationLevel"];
  acceptedProfessions?: string[];
  certifications?: string[];
  licenseRequired?: boolean;
}) {
  const auth = await requireAuth();
  let label = input.tenderId;
  try {
    const proceso = await getProcesoSeguimiento(input.tenderId);
    label = proceso.titulo ?? proceso.secopId ?? input.tenderId;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new PerfilesError(400, "tender_missing", "El proceso no existe. No se creó la asociación.");
    }
    throw error;
  }
  const role: TenderStaffRole = {
    id: newId(),
    name: input.roleName,
    educationLevel: input.educationLevel ?? "",
    acceptedProfessions: input.acceptedProfessions ?? [],
    postgraduate: "",
    licenseRequired: input.licenseRequired ?? false,
    generalMonths: input.generalMonths ?? 0,
    specificMonths: input.specificMonths ?? 0,
    specificCriteria: input.specificCriteria ?? "",
    certifications: input.certifications ?? [],
    skills: [],
    requiredDocuments: [],
    resumeFormat: "corporativo",
    referenceDate: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date()),
  };
  const assignment = await professionalService().assignToTender(auth, input.professionalId, { id: input.tenderId, label }, role);
  revalidate();
  return assignment;
}

export async function listTenderTeamAction(tenderId: string) {
  const auth = await requireAuth();
  return professionalService().listTenderTeam(auth, tenderId);
}

export async function listProcesosForPerfilesAction() {
  await requireAuth(["administrador", "director", "gestor"]);
  try {
    const rows = await listProcesosSeguimiento({ estado: "en_seguimiento" });
    return rows.map((row) => ({
      id: row.id,
      label: row.titulo ?? row.secopId ?? row.id,
      entidad: row.entidad,
    }));
  } catch {
    return [];
  }
}

export async function saveEntityTemplateAction(formData: FormData) {
  const auth = await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new PerfilesError(400, "validation", "Seleccione un DOCX.");
  const bytes = Buffer.from(await file.arrayBuffer());
  return professionalService().saveEntityTemplate(auth, bytes);
}

export async function searchProfessionalsAction(query: string) {
  const auth = await requireAuth();
  const result = await professionalService().list(auth, { search: query }, 1, 20);
  return result.items;
}
