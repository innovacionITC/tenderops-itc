import type {
  GeneratedResume,
  ProfessionalAttachment,
  ProfessionalCertification,
  ProfessionalConsent,
  ProfessionalEducation,
  ProfessionalExperience,
  ProfessionalLicense,
  ProfessionalRecord,
  ProfessionalSkill,
  TenderAssignment,
} from "./contracts";
import { maskDocument, maskEmail, maskPhone } from "./pii";
import { bogotaToday, plusDays } from "./overlap";

export interface StoredProfessional {
  id: string;
  organizationId: string;
  externalId: string | null;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  documentType: string;
  documentNumber: string | null;
  identityFingerprint: string | null;
  email: string | null;
  phone: string | null;
  profession: string;
  primaryProfile: string;
  specialty: string;
  city: string;
  department: string;
  country: string;
  generalExperienceMonths: number;
  availability: ProfessionalRecord["professional"]["availability"];
  verificationStatus: ProfessionalRecord["professional"]["verification"];
  status: ProfessionalRecord["professional"]["status"];
  education: ProfessionalEducation[];
  experiences: ProfessionalExperience[];
  certifications: ProfessionalCertification[];
  licenses: ProfessionalLicense[];
  skills: ProfessionalSkill[];
  attachments: ProfessionalAttachment[];
  consent: ProfessionalConsent | null;
  generatedResumes: GeneratedResume[];
  tenderAssignments: TenderAssignment[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  linkage: ProfessionalRecord["professional"]["linkage"];
}

export function isIncomplete(row: StoredProfessional): boolean {
  return (
    !row.education.length ||
    row.experiences.some((item) => item.verification !== "verificado") ||
    !row.consent?.store
  );
}

export function toPublicRecord(row: StoredProfessional): ProfessionalRecord {
  const incomplete = isIncomplete(row);
  return {
    professional: {
      id: row.id,
      organizationId: row.organizationId,
      externalId: row.externalId ?? row.id,
      givenName: row.firstName,
      middleName: row.middleName,
      familyName: row.lastName,
      fullName: row.fullName,
      documentType: row.documentType,
      documentNumberMasked: row.documentNumber ? maskDocument(row.documentNumber) : "",
      profession: row.profession,
      specialty: row.specialty,
      primaryProfile: row.primaryProfile,
      city: row.city,
      department: row.department,
      country: row.country,
      linkage: row.linkage,
      availability: row.availability,
      status: row.status,
      verification: incomplete && row.verificationStatus === "pendiente" ? "incompleto" : row.verificationStatus,
      incomplete,
      notes: row.notes,
      generalExperienceMonths: row.generalExperienceMonths,
      yearsGeneral: Math.round(row.generalExperienceMonths / 12),
      emailMasked: row.email ? maskEmail(row.email) : undefined,
      phoneMasked: row.phone ? maskPhone(row.phone) : undefined,
      certificationCount: row.certifications.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
    },
    education: row.education,
    experiences: row.experiences,
    certifications: row.certifications,
    licenses: row.licenses,
    skills: row.skills,
    attachments: row.attachments,
    consent: row.consent,
    generatedResumes: row.generatedResumes,
    tenderAssignments: row.tenderAssignments,
  };
}

export function computeIndicators(rows: StoredProfessional[]) {
  const today = bogotaToday();
  const soonLimit = plusDays(today, 60);
  const expiring = rows.flatMap((row) => row.certifications).filter((item) => {
    if (!item.expiresOn) return false;
    return item.expiresOn >= today && item.expiresOn <= soonLimit;
  });
  const proposed = new Set(
    rows.filter((row) => row.tenderAssignments.some((assignment) => assignment.status !== "retirado")).map((row) => row.id),
  );
  const pendingDocuments =
    rows.flatMap((row) => row.attachments).filter((item) => item.status !== "asociado").length +
    rows.flatMap((row) => row.experiences).filter((item) => !item.supportRef).length +
    rows.flatMap((row) => row.education).filter((item) => !item.supportRef).length;
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === "activo").length,
    available: rows.filter((row) => row.availability === "disponible").length,
    incomplete: rows.filter((row) => isIncomplete(row)).length,
    expiringCertifications: expiring.length,
    proposed: proposed.size,
    pendingDocuments,
  };
}
