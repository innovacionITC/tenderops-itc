-- Banco de Perfiles Profesionales (TenderOps)
-- Idempotente. Ejecutar en Supabase SQL Editor con un rol que pueda crear
-- tablas, políticas RLS y buckets de Storage.
--
-- Este módulo usa UNA tabla maestra. Los detalles (estudios, experiencias,
-- certificaciones, acreditaciones, competencias, soportes, consentimiento,
-- hojas de vida y asignaciones a procesos) viven en JSONB con IDs estables
-- por elemento. Los binarios (DOCX, PDF) NO se guardan en JSONB: solo la
-- ruta en el bucket privado `professional-documents`.
--
-- Autenticación de la app: API .NET + BFF Next.js. El navegador no usa
-- service_role ni consulta esta tabla. RLS bloquea anon/authenticated.
-- El backend autentica, aísla por organization_id y habla con Postgres
-- (DATABASE_URL) / Storage (SUPABASE_SERVICE_ROLE_KEY).

CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  external_id text,
  first_name text NOT NULL DEFAULT '',
  middle_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  document_type text NOT NULL DEFAULT 'CC',
  document_number text,
  identity_fingerprint text,
  email text,
  phone text,
  profession text NOT NULL DEFAULT '',
  primary_profile text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'CO',
  general_experience_months integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'disponible'
    CHECK (availability IN ('disponible', 'parcial', 'no_disponible', 'por_confirmar', 'asignado')),
  verification_status text NOT NULL DEFAULT 'pendiente'
    CHECK (verification_status IN ('pendiente', 'verificado', 'rechazado', 'incompleto')),
  status text NOT NULL DEFAULT 'activo'
    CHECK (status IN ('activo', 'inactivo', 'borrador')),
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  licenses jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  consent jsonb,
  generated_resumes jsonb NOT NULL DEFAULT '[]'::jsonb,
  tender_assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  linkage text NOT NULL DEFAULT 'empleado'
    CHECK (linkage IN ('empleado', 'contratista', 'aliado', 'independiente')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

COMMENT ON TABLE public.professional_profiles IS
  'Maestro del banco de perfiles. PII (document_number, email, phone) solo para el backend autenticado.';
COMMENT ON COLUMN public.professional_profiles.document_number IS
  'Dato sensible Ley 1581. Nunca exponer al cliente; usar máscara + identity_fingerprint.';
COMMENT ON COLUMN public.professional_profiles.identity_fingerprint IS
  'SHA-256(organization_id|tipo|número) para detectar duplicados sin exponer el documento.';
COMMENT ON COLUMN public.professional_profiles.generated_resumes IS
  'Metadatos y snapshot de cada HV. El DOCX vive en Storage (storage_path), no en este JSONB.';
COMMENT ON COLUMN public.professional_profiles.tender_assignments IS
  'Asociaciones a procesos de seguimiento reales (id de procesos-seguimiento), no ficticias.';

CREATE UNIQUE INDEX IF NOT EXISTS professional_profiles_org_external_uidx
  ON public.professional_profiles (organization_id, external_id)
  WHERE external_id IS NOT NULL AND btrim(external_id) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS professional_profiles_org_fingerprint_uidx
  ON public.professional_profiles (organization_id, identity_fingerprint)
  WHERE identity_fingerprint IS NOT NULL AND btrim(identity_fingerprint) <> '';

CREATE INDEX IF NOT EXISTS professional_profiles_org_updated_idx
  ON public.professional_profiles (organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS professional_profiles_org_status_idx
  ON public.professional_profiles (organization_id, status, availability);

CREATE INDEX IF NOT EXISTS professional_profiles_full_name_idx
  ON public.professional_profiles (organization_id, lower(full_name));

CREATE INDEX IF NOT EXISTS professional_profiles_education_gin
  ON public.professional_profiles USING gin (education jsonb_path_ops);

CREATE INDEX IF NOT EXISTS professional_profiles_experiences_gin
  ON public.professional_profiles USING gin (experiences jsonb_path_ops);

CREATE INDEX IF NOT EXISTS professional_profiles_certifications_gin
  ON public.professional_profiles USING gin (certifications jsonb_path_ops);

CREATE OR REPLACE FUNCTION public.professional_profiles_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professional_profiles_set_updated_at ON public.professional_profiles;
CREATE TRIGGER professional_profiles_set_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.professional_profiles_touch_updated_at();

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.professional_profiles FROM PUBLIC;
REVOKE ALL ON public.professional_profiles FROM anon;
REVOKE ALL ON public.professional_profiles FROM authenticated;

DROP POLICY IF EXISTS professional_profiles_no_direct_client ON public.professional_profiles;
CREATE POLICY professional_profiles_no_direct_client
  ON public.professional_profiles
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Bucket privado para HV, plantillas de entidad y soportes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'professional-documents',
  'professional-documents',
  false,
  20971520,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS professional_documents_no_direct_client ON storage.objects;
CREATE POLICY professional_documents_no_direct_client
  ON storage.objects
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (bucket_id <> 'professional-documents')
  WITH CHECK (bucket_id <> 'professional-documents');
