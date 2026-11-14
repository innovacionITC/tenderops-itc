"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileSpreadsheet, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ItcButton, ItcInput, ItcTable, type TableColumn } from "@/components/itc";
import { TablePagination } from "@/components/layout/table-pagination";
import { FiltrosPanel, type CampoFiltro } from "@/components/layout/filtros-panel";
import { StatCard } from "@/components/layout/stat-card";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import {
  AVAILABILITY_LABELS,
  STATUS_LABELS,
  VERIFICATION_LABELS,
  type AvailabilityStatus,
  type Professional,
  type ProfessionalFilters,
  type ProfessionalIndicators,
  type VerificationStatus,
} from "@/lib/perfiles/contracts";
import { ProfessionalDetailSheet } from "./professional-detail-sheet";
import { ProfessionalFormSheet } from "./professional-form-sheet";
import { ImportWizard } from "./import-wizard";
import { ResumeBuilder } from "./resume-builder";
import { deactivatePerfilAction } from "./actions";

function verificationTone(value: VerificationStatus) {
  if (value === "verificado") return "success" as const;
  if (value === "rechazado") return "danger" as const;
  if (value === "incompleto") return "warning" as const;
  return "muted" as const;
}

function availabilityTone(value: AvailabilityStatus) {
  if (value === "disponible") return "success" as const;
  if (value === "no_disponible") return "danger" as const;
  if (value === "asignado") return "info" as const;
  return "warning" as const;
}

export function PerfilesView({
  indicators,
  rows,
  total,
  page,
  pageSize,
  filters,
  canEdit,
  canApprove,
  loadError,
  openProfessionalId,
  openResume,
  procesoId,
}: {
  indicators: ProfessionalIndicators;
  rows: Professional[];
  total: number;
  page: number;
  pageSize: number;
  filters: ProfessionalFilters;
  canEdit: boolean;
  canApprove: boolean;
  loadError: string | null;
  openProfessionalId: string | null;
  openResume: boolean;
  procesoId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(openProfessionalId);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(openResume);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const setParams = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      buscar: filters.search,
      profession: filters.profession,
      profile: filters.profile,
      specialty: filters.specialty,
      technology: filters.technology,
      certification: filters.certification,
      city: filters.city,
      availability: filters.availability,
      status: filters.status,
      minYears: filters.minYears ? String(filters.minYears) : undefined,
      sort: filters.sort,
      page: String(page),
    };
    Object.assign(current, patch);
    for (const [key, value] of Object.entries(current)) {
      if (value) params.set(key, value);
    }
    if (patch.page === undefined) params.set("page", "1");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const campos: CampoFiltro[] = [
    { tipo: "texto", clave: "profession", etiqueta: "Profesión", seccion: "Perfil", placeholder: "Ingeniería…" },
    { tipo: "texto", clave: "profile", etiqueta: "Perfil principal", seccion: "Perfil" },
    { tipo: "texto", clave: "specialty", etiqueta: "Especialidad", seccion: "Perfil" },
    { tipo: "texto", clave: "technology", etiqueta: "Tecnologías", seccion: "Competencias" },
    { tipo: "texto", clave: "certification", etiqueta: "Certificaciones", seccion: "Competencias" },
    { tipo: "texto", clave: "city", etiqueta: "Ciudad", seccion: "Ubicación" },
    { tipo: "texto", clave: "minYears", etiqueta: "Años de experiencia (mín.)", seccion: "Experiencia" },
    {
      tipo: "select",
      clave: "availability",
      etiqueta: "Disponibilidad",
      seccion: "Estado",
      opciones: Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      tipo: "select",
      clave: "status",
      etiqueta: "Estado",
      seccion: "Estado",
      opciones: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
  ];

  const filterValues = {
    profession: filters.profession ?? "",
    profile: filters.profile ?? "",
    specialty: filters.specialty ?? "",
    technology: filters.technology ?? "",
    certification: filters.certification ?? "",
    city: filters.city ?? "",
    minYears: filters.minYears ? String(filters.minYears) : "",
    availability: filters.availability ?? "",
    status: filters.status ?? "",
  };

  const columns = useMemo<TableColumn<Professional>[]>(
    () => [
      {
        key: "sel",
        title: "",
        render: (row) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={(event) => {
              setSelectedIds((current) =>
                event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id),
              );
            }}
            aria-label={`Seleccionar ${row.fullName}`}
          />
        ),
      },
      {
        key: "nombre",
        title: "Profesional",
        render: (row) => (
          <button className="text-left" onClick={() => setSelectedId(row.id)}>
            <div className="font-medium text-foreground">{row.fullName}</div>
            <div className="text-xs text-muted-foreground">{row.profession || "Sin profesión"}</div>
          </button>
        ),
      },
      { key: "primaryProfile", title: "Perfil principal", render: (row) => row.primaryProfile || "—" },
      {
        key: "experiencia",
        title: "Experiencia",
        render: (row) => (
          <span className="tabular-nums">
            {row.yearsGeneral} años
            <span className="block text-[11px] text-muted-foreground">{row.generalExperienceMonths} meses netos</span>
          </span>
        ),
      },
      {
        key: "certificaciones",
        title: "Certificaciones",
        render: (row) => row.certificationCount || "—",
      },
      { key: "city", title: "Ciudad", render: (row) => row.city || "—" },
      {
        key: "availability",
        title: "Disponibilidad",
        render: (row) => (
          <StatusBadge tone={availabilityTone(row.availability)}>{AVAILABILITY_LABELS[row.availability]}</StatusBadge>
        ),
      },
      {
        key: "verification",
        title: "Verificación",
        render: (row) => (
          <StatusBadge tone={verificationTone(row.verification)}>{VERIFICATION_LABELS[row.verification]}</StatusBadge>
        ),
      },
      {
        key: "updatedAt",
        title: "Actualización",
        render: (row) => <span className="text-xs tabular-nums">{formatDate(row.updatedAt)}</span>,
      },
      {
        key: "acciones",
        title: "Acciones",
        align: "right",
        render: (row) => (
          <div className="flex justify-end gap-1">
            <ItcButton className="px-2 py-1 text-xs" onClick={() => setSelectedId(row.id)}>
              Ficha
            </ItcButton>
            {canEdit && (
              <ItcButton
                className="px-2 py-1 text-xs"
                onClick={() => {
                  setSelectedId(row.id);
                  setResumeOpen(true);
                }}
              >
                HV
              </ItcButton>
            )}
          </div>
        ),
      },
    ],
    [canEdit, selectedIds],
  );

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Total" value={indicators.total} />
        <StatCard label="Activos" value={indicators.active} tone="success" />
        <StatCard label="Disponibles" value={indicators.available} tone="info" />
        <StatCard label="Incompletos" value={indicators.incomplete} tone={indicators.incomplete ? "warning" : "default"} />
        <StatCard label="Cert. por vencer" value={indicators.expiringCertifications} tone={indicators.expiringCertifications ? "warning" : "default"} />
        <StatCard label="Propuestos" value={indicators.proposed} />
        <StatCard label="Docs pendientes" value={indicators.pendingDocuments} tone={indicators.pendingDocuments ? "warning" : "default"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-[16rem] flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ buscar: search || undefined });
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <ItcInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar: nombre, profesión, tecnología o certificación"
              className="pl-9"
              aria-label="Buscar profesionales"
            />
          </div>
          <ItcButton type="submit" disabled={isPending}>
            Buscar
          </ItcButton>
        </form>
        <FiltrosPanel
          campos={campos}
          valores={filterValues}
          onAplicar={(valores) =>
            setParams({
              profession: valores.profession || undefined,
              profile: valores.profile || undefined,
              specialty: valores.specialty || undefined,
              technology: valores.technology || undefined,
              certification: valores.certification || undefined,
              city: valores.city || undefined,
              availability: valores.availability || undefined,
              status: valores.status || undefined,
              minYears: valores.minYears || undefined,
            })
          }
          onLimpiar={() =>
            setParams({
              profession: undefined,
              profile: undefined,
              specialty: undefined,
              technology: undefined,
              certification: undefined,
              city: undefined,
              availability: undefined,
              status: undefined,
              minYears: undefined,
            })
          }
        />
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted-foreground">Orden:</span>
          {(
            [
              ["updated_at", "Actualización"],
              ["full_name", "Nombre"],
              ["experiencia", "Experiencia"],
            ] as const
          ).map(([value, label]) => (
            <ItcButton
              key={value}
              className={`px-2 py-1 text-xs ${(filters.sort ?? "updated_at") === value ? "bg-primary/10" : ""}`}
              variant="secondary"
              onClick={() => setParams({ sort: value })}
            >
              {label}
            </ItcButton>
          ))}
        </div>
        {canEdit && (
          <>
            <ItcButton variant="secondary" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" /> Importar Excel
            </ItcButton>
            <ItcButton variant="secondary" onClick={() => setResumeOpen(true)}>
              <Sparkles className="h-4 w-4" /> Generar hoja de vida
            </ItcButton>
            <ItcButton onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Crear profesional
            </ItcButton>
          </>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="crystal-surface flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-sm">
          <span>{selectedIds.length} seleccionados</span>
          <ItcButton className="text-xs" onClick={() => setSelectedIds([])}>
            Limpiar
          </ItcButton>
          {canEdit && selectedIds.length === 1 && (
            <ItcButton
              className="text-xs"
              onClick={() => {
                startTransition(async () => {
                  try {
                    await deactivatePerfilAction(selectedIds[0]!);
                    toast.success("Profesional desactivado");
                    setSelectedIds([]);
                    router.refresh();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "No se pudo desactivar");
                  }
                });
              }}
            >
              Desactivar
            </ItcButton>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {loadError
            ? "No hay datos mientras la persistencia no esté disponible."
            : "No hay profesionales en la organización activa. Cree uno o importe un Excel."}
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(row) => row.id}
          pagination={false}
          striped
          hoverable
          stickyHeader
        />
      )}

      <TablePagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        itemLabel="profesionales"
        disabled={isPending}
        onPageChange={(next) => setParams({ page: String(next) })}
      />

      <ProfessionalDetailSheet
        professionalId={selectedId}
        open={Boolean(selectedId) && !resumeOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        canEdit={canEdit}
        canApprove={canApprove}
        onGenerate={() => setResumeOpen(true)}
      />
      <ProfessionalFormSheet open={createOpen} onOpenChange={setCreateOpen} />
      <ImportWizard open={importOpen} onOpenChange={setImportOpen} />
      <ResumeBuilder
        key={`${selectedId ?? "none"}-${procesoId ?? "none"}`}
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        initialProfessionalId={selectedId}
        initialTenderId={procesoId}
      />
    </div>
  );
}
