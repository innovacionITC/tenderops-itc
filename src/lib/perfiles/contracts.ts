export type ProfessionalStatus = "activo" | "inactivo" | "borrador";
export type AvailabilityStatus =
  | "disponible"
  | "parcial"
  | "no_disponible"
  | "por_confirmar"
  | "asignado";
export type VerificationStatus = "pendiente" | "verificado" | "rechazado" | "incompleto";
export type EducationLevel =
  | "bachiller"
  | "tecnico"
  | "tecnologo"
  | "profesional"
  | "especializacion"
  | "maestria"
  | "doctorado";
export type LinkageType = "empleado" | "contratista" | "aliado" | "independiente";
export type MatchOutcome = "cumple" | "no_cumple" | "pendiente_validar" | "cumple_parcial";
export type ResumeFormat = "corporativo" | "entidad";
export type DuplicateAction = "conservar" | "actualizar" | "omitir" | "revisar";

export interface ProfessionalEducation {
  id: string;
  externalId: string;
  level: EducationLevel;
  title: string;
  institution: string;
  country: string;
  startedOn: string | null;
  graduatedOn: string | null;
  status: "en_curso" | "graduado" | "pendiente";
  supportRef: string | null;
  verification: VerificationStatus;
}

export interface ProfessionalExperience {
  id: string;
  externalId: string;
  client: string;
  employer: string;
  project: string;
  role: string;
  startedOn: string;
  endedOn: string | null;
  current: boolean;
  functions: string;
  activities: string[];
  technologies: string[];
  sector: string;
  projectType: string;
  contractObject: string;
  supportRef: string | null;
  verification: VerificationStatus;
  monthsVerified: number;
}

export interface ProfessionalCertification {
  id: string;
  externalId: string;
  name: string;
  issuer: string;
  credentialCode: string;
  issuedOn: string | null;
  expiresOn: string | null;
  verificationUrl: string | null;
  category: string;
  supportRef: string | null;
  validity: "vigente" | "vencida" | "sin_fecha" | "pendiente";
  verification: VerificationStatus;
}

export interface ProfessionalLicense {
  id: string;
  externalId: string;
  kind: "matricula" | "tarjeta" | "licencia" | "registro";
  issuer: string;
  number: string;
  profession: string;
  issuedOn: string | null;
  status: "vigente" | "vencida" | "pendiente" | "sin_confirmar";
  supportRef: string | null;
  verification: VerificationStatus;
}

export interface ProfessionalSkill {
  id: string;
  name: string;
  category: string;
  level: "basico" | "intermedio" | "avanzado" | "acreditado" | "aprobado";
}

export interface ProfessionalAttachment {
  id: string;
  kind:
    | "hv_original"
    | "diploma"
    | "acta"
    | "certificado"
    | "laboral"
    | "matricula"
    | "consentimiento"
    | "otro";
  name: string;
  storagePath: string | null;
  relatedRecordId: string | null;
  hash: string | null;
  status: "pendiente" | "asociado" | "no_asociado";
  createdAt: string;
}

export interface ProfessionalConsent {
  id: string;
  store: boolean;
  consult: boolean;
  present: boolean;
  shareWithEntity: boolean;
  legalBasis: string;
  grantedOn: string | null;
  evidenceRef: string | null;
}

export interface MatchEvidence {
  kind: string;
  recordId: string;
  label: string;
  months?: number;
  note?: string;
}

export interface MatchResult {
  professionalId: string;
  roleId: string;
  outcome: MatchOutcome;
  score: number;
  reasons: string[];
  evidence: MatchEvidence[];
  generalMonths: number;
  specificMonths: number;
  missingSupports: string[];
  warnings: string[];
}

export interface TenderStaffRole {
  id: string;
  name: string;
  educationLevel: EducationLevel | "";
  acceptedProfessions: string[];
  postgraduate: string;
  licenseRequired: boolean;
  generalMonths: number;
  specificMonths: number;
  specificCriteria: string;
  certifications: string[];
  skills: string[];
  requiredDocuments: string[];
  resumeFormat: ResumeFormat;
  referenceDate: string;
}

export interface TenderAssignment {
  id: string;
  tenderId: string;
  tenderLabel: string;
  roleName: string;
  role: TenderStaffRole;
  match: MatchResult | null;
  status: "propuesto" | "confirmado" | "retirado";
  resumeId: string | null;
  createdAt: string;
  createdBy: string;
}

export interface ResumeSelection {
  includeName: boolean;
  includeIdentification: boolean;
  includeProfession: boolean;
  includeSpecialty: boolean;
  includeCity: boolean;
  includeContact: boolean;
  includeSummary: boolean;
  educationIds: string[];
  experienceIds: string[];
  certificationIds: string[];
  licenseIds: string[];
  attachmentIds: string[];
  experienceOrder: "reciente" | "antigua" | "relevancia" | "manual";
  summary: string;
}

export interface GeneratedResume {
  id: string;
  professionalId: string;
  organizationId: string;
  tenderId: string | null;
  tenderLabel: string | null;
  proposedRoleName: string;
  templateId: string;
  templateVersion: string;
  format: ResumeFormat;
  version: number;
  status: "borrador" | "generado" | "aprobado" | "obsoleto";
  storagePath: string | null;
  hash: string | null;
  warnings: string[];
  selection: ResumeSelection;
  snapshot: {
    fullName: string;
    proposedRoleName: string;
    profession: string;
    city: string;
    summary: string;
    education: ProfessionalEducation[];
    experiences: ProfessionalExperience[];
    certifications: ProfessionalCertification[];
    licenses: ProfessionalLicense[];
    selectedExperienceMonths: number;
  };
  createdAt: string;
  createdBy: string;
  createdByEmail: string | null;
}

export interface Professional {
  id: string;
  organizationId: string;
  externalId: string;
  givenName: string;
  middleName: string;
  familyName: string;
  fullName: string;
  documentType: string;
  documentNumberMasked: string;
  profession: string;
  specialty: string;
  primaryProfile: string;
  city: string;
  department: string;
  country: string;
  linkage: LinkageType;
  availability: AvailabilityStatus;
  status: ProfessionalStatus;
  verification: VerificationStatus;
  incomplete: boolean;
  notes: string;
  generalExperienceMonths: number;
  yearsGeneral: number;
  emailMasked?: string;
  phoneMasked?: string;
  certificationCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface ProfessionalRecord {
  professional: Professional;
  education: ProfessionalEducation[];
  experiences: ProfessionalExperience[];
  certifications: ProfessionalCertification[];
  licenses: ProfessionalLicense[];
  skills: ProfessionalSkill[];
  attachments: ProfessionalAttachment[];
  consent: ProfessionalConsent | null;
  generatedResumes: GeneratedResume[];
  tenderAssignments: TenderAssignment[];
}

export interface ProfessionalIndicators {
  total: number;
  active: number;
  available: number;
  incomplete: number;
  expiringCertifications: number;
  proposed: number;
  pendingDocuments: number;
}

export interface ProfessionalFilters {
  search?: string;
  profession?: string;
  profile?: string;
  specialty?: string;
  technology?: string;
  certification?: string;
  minYears?: number;
  city?: string;
  availability?: AvailabilityStatus;
  status?: ProfessionalStatus;
  verification?: VerificationStatus;
  sort?: "updated_at" | "full_name" | "experiencia";
}

export interface ImportIssue {
  id: string;
  sheet: string;
  row: number;
  field: string;
  value: string;
  error: string;
  action: string;
  severity: "error" | "warning";
}

export interface ImportPreviewRow {
  externalId: string;
  fullName: string;
  action: "crear" | "actualizar" | "omitir" | "revisar";
  existingId: string | null;
  education: number;
  experiences: number;
  certifications: number;
  issues: number;
}

export interface ImportStats {
  rows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  education: number;
  experiences: number;
  certifications: number;
  duplicates: number;
}

export interface ImportAnalysis {
  mapping: Record<string, string>;
  sheets: { name: string; headers: string[]; rows: number }[];
  preview: ImportPreviewRow[];
  issues: ImportIssue[];
  stats: ImportStats;
}

export interface ProfessionalWriteInput {
  givenName: string;
  middleName?: string;
  familyName: string;
  documentType?: string;
  documentNumber?: string;
  externalId?: string;
  profession?: string;
  specialty?: string;
  primaryProfile?: string;
  city?: string;
  department?: string;
  country?: string;
  linkage?: LinkageType;
  availability?: AvailabilityStatus;
  status?: ProfessionalStatus;
  notes?: string;
  email?: string;
  phone?: string;
}

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  disponible: "Disponible",
  parcial: "Parcial",
  no_disponible: "No disponible",
  por_confirmar: "Por confirmar",
  asignado: "Asignado",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pendiente: "Pendiente",
  verificado: "Verificado",
  rechazado: "Rechazado",
  incompleto: "Incompleto",
};

export const STATUS_LABELS: Record<ProfessionalStatus, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  borrador: "Borrador",
};

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  bachiller: "Bachiller",
  tecnico: "Técnico",
  tecnologo: "Tecnólogo",
  profesional: "Profesional",
  especializacion: "Especialización",
  maestria: "Maestría",
  doctorado: "Doctorado",
};

export const MATCH_LABELS: Record<MatchOutcome, string> = {
  cumple: "Cumple (acreditado)",
  cumple_parcial: "Cumple parcial",
  pendiente_validar: "Sin soporte / pendiente de verificar",
  no_cumple: "No cumple",
};
