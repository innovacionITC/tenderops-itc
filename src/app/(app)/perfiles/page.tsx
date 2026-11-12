import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { PerfilesError } from "@/lib/perfiles/errors";
import { professionalService } from "@/lib/perfiles/server";
import type {
  AvailabilityStatus,
  Professional,
  ProfessionalFilters,
  ProfessionalStatus,
} from "@/lib/perfiles/contracts";
import { PerfilesView } from "./perfiles-view";
import { canApprove, canFollow } from "@/lib/auth/roles";

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PerfilesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const auth = await requireAuth();
  const params = await searchParams;
  const page = Math.max(Number(first(params.page)) || 1, 1);
  const pageSize = Number(first(params.pageSize)) || 25;
  const sortParam = first(params.sort);
  const filters: ProfessionalFilters = {
    search: first(params.buscar)?.trim() || undefined,
    profession: first(params.profession)?.trim() || undefined,
    profile: first(params.profile)?.trim() || undefined,
    specialty: first(params.specialty)?.trim() || undefined,
    technology: first(params.technology)?.trim() || undefined,
    certification: first(params.certification)?.trim() || undefined,
    city: first(params.city)?.trim() || undefined,
    availability: first(params.availability) as AvailabilityStatus | undefined,
    status: first(params.status) as ProfessionalStatus | undefined,
    minYears: first(params.minYears) ? Number(first(params.minYears)) : undefined,
    sort: sortParam === "full_name" || sortParam === "experiencia" ? sortParam : "updated_at",
  };

  let loadError: string | null = null;
  let indicators = {
    total: 0,
    active: 0,
    available: 0,
    incomplete: 0,
    expiringCertifications: 0,
    proposed: 0,
    pendingDocuments: 0,
  };
  let list: { items: Professional[]; total: number; page: number; pageSize: number } = {
    items: [],
    total: 0,
    page,
    pageSize,
  };

  try {
    const service = professionalService();
    [indicators, list] = await Promise.all([
      service.indicators(auth),
      service.list(auth, filters, page, pageSize),
    ]);
  } catch (error) {
    loadError =
      error instanceof PerfilesError
        ? error.message
        : error instanceof Error
          ? error.message
          : "No se pudo consultar el banco de perfiles.";
  }

  return (
    <>
      <PageHeader
        title="Banco de perfiles"
        description="Talento de la organización activa, persistido en Supabase. La hoja de vida se arma con estudios, experiencias y certificaciones seleccionados."
      />
      <div className="page-body">
        <PerfilesView
          indicators={indicators}
          rows={list.items}
          total={list.total}
          page={list.page}
          pageSize={list.pageSize}
          filters={filters}
          canEdit={canFollow(auth.role)}
          canApprove={canApprove(auth.role)}
          loadError={loadError}
          openProfessionalId={first(params.profesional) ?? null}
          openResume={first(params.hv) === "1"}
          procesoId={first(params.proceso) ?? null}
        />
      </div>
    </>
  );
}
