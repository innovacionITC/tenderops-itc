import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/session";
import { listAuditoria } from "@/lib/auditoria";
import { listUsuariosAsignables } from "@/lib/usuarios-asignables";
import { AuditoriaView } from "./auditoria-view";
import { AuditoriaErrorBanner } from "./auditoria-error-banner";
import { clasificarAuditoriaError, type AuditoriaErrorTipo } from "@/lib/errors/auditoria";
import type { AuditoriaFiltrosDisponibles } from "@/lib/auditoria-shared";
import type { Paginado } from "@/lib/secop-shared";
import type { AuditoriaRow } from "@/lib/auditoria-shared";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    userId?: string;
    role?: string;
    module?: string;
    operationType?: string;
    result?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    sortBy?: string;
    sortDir?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await requireAuth(["administrador", "director"]);
  const params = await searchParams;

  const userId = params.userId || undefined;
  const role = params.role || undefined;
  const modulo = params.module || undefined;
  const operationType = params.operationType || undefined;
  const result = params.result || undefined;
  const fechaDesde = params.fechaDesde || undefined;
  const fechaHasta = params.fechaHasta || undefined;
  const sortBy = params.sortBy || undefined;
  const sortDir = params.sortDir || undefined;
  const page = Math.max(Number(params.page) || 1, 1);
  const pageSize = Number(params.pageSize) || 50;

  let resultado: {
    eventos: Paginado<AuditoriaRow>;
    filtrosDisponibles: AuditoriaFiltrosDisponibles;
  } | null = null;
  let errorTipo: AuditoriaErrorTipo | null = null;

  try {
    const [eventos, usuarios] = await Promise.all([
      listAuditoria({
        userId,
        role,
        module: modulo,
        operationType,
        result,
        from: fechaDesde,
        to: fechaHasta,
        sortBy,
        sortDir,
        page,
        pageSize,
      }),
      listUsuariosAsignables(),
    ]);

    resultado = {
      eventos,
      filtrosDisponibles: {
        usuarios: usuarios.map((u) => ({ id: u.id, name: u.name })),
      },
    };
  } catch (e) {
    errorTipo = clasificarAuditoriaError(e);
  }

  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Bitácora de eventos del sistema: consultas, mutaciones, login/logout y sincronizaciones."
      />
      <div className="page-body space-y-3">
        {errorTipo || !resultado ? (
          <AuditoriaErrorBanner tipo={errorTipo ?? "error_consulta"} />
        ) : (
          <AuditoriaView
            eventos={resultado.eventos}
            filtros={{
              userId: userId ?? "",
              role: role ?? "",
              module: modulo ?? "",
              operationType: operationType ?? "",
              result: result ?? "",
              fechaDesde: fechaDesde ?? "",
              fechaHasta: fechaHasta ?? "",
              sortBy: sortBy ?? "createdAt",
              sortDir: sortDir ?? "desc",
              pageSize,
            }}
            filtrosDisponibles={resultado.filtrosDisponibles}
          />
        )}
      </div>
    </>
  );
}
