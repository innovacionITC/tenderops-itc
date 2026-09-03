"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ItcButton, ItcTabs, ItcModal } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { type ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";
import type { TaskRow } from "@/lib/tasks";
import { cerrarSeguimiento } from "./actions";
import { TareasTab } from "./tareas-tab";
import { AnalisisIaTab } from "./analisis-ia-tab";
import { MatrizCumplimientoTab } from "./matriz-cumplimiento-tab";
import { AsistenteIaTab } from "./asistente-ia-tab";
import { CrmTab } from "./crm-tab";
import { type OportunidadDocumentoRow } from "./crm-actions";

type TabKey = "analisis-ia" | "asistente-ia" | "matriz-cumplimiento" | "tareas" | "crm";

// "presentado" no es un cierre: el proceso sigue activo mientras se conoce el
// resultado real, por eso tiene su propio estado en vez de cerrado/en_seguimiento.
const ESTADO_LABEL: Record<ProcesoSeguimientoRow["estado"], string> = {
  en_seguimiento: "En seguimiento",
  presentado: "Presentado",
  cerrado: "Cerrado",
};

const ESTADO_TONE: Record<ProcesoSeguimientoRow["estado"], "info" | "success" | "muted"> = {
  en_seguimiento: "info",
  presentado: "success",
  cerrado: "muted",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "analisis-ia", label: "Análisis IA" },
  { key: "asistente-ia", label: "Asistente IA" },
  { key: "matriz-cumplimiento", label: "Matriz de cumplimiento" },
  { key: "tareas", label: "Tareas" },
  { key: "crm", label: "CRM" },
];

type AnalisisIa = {
  id: string;
  summary: string | null;
  opportunityLevel: string | null;
  riskLevel: string | null;
  complexityLevel: string | null;
  fit: string | null;
  criticalRequirements: string | null;
  alerts: string | null;
  recommendation: string | null;
  justification: string | null;
  suggestedModality: string | null;
  matrixTotal: number | null;
  matrixCumplidos: number | null;
  matrixPendientes: number | null;
  matrixNoCumple: number | null;
  matrixRiesgoAlto: number | null;
  createdAt: string;
};

export function WorkspaceView({
  proceso,
  tareas,
  usuariosAsignables,
  analisisIa,
  documentosCrm,
  directLineBaseUrl,
}: {
  proceso: ProcesoSeguimientoRow;
  tareas: TaskRow[];
  usuariosAsignables: { id: string; name: string }[];
  analisisIa: AnalisisIa | null;
  documentosCrm: OportunidadDocumentoRow[];
  directLineBaseUrl: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cerrarTarget, setCerrarTarget] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("analisis-ia");

  const handleCerrar = () => {
    startTransition(async () => {
      try {
        await cerrarSeguimiento(proceso.id);
        toast.success("Seguimiento cerrado");
        setCerrarTarget(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo cerrar el seguimiento");
      }
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {proceso.titulo ?? proceso.secopId ?? "Proceso sin título"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={ESTADO_TONE[proceso.estado]}>{ESTADO_LABEL[proceso.estado]}</StatusBadge>
            {proceso.resultado && (
              <StatusBadge tone="success">{proceso.resultado}</StatusBadge>
            )}
          </div>
          {proceso.resultado === "descartado" && proceso.motivoDescarte && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Motivo del descarte:</span>{" "}
              {proceso.motivoDescarte}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {proceso.url && (
            <a
              href={proceso.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir en SECOP
            </a>
          )}
          <ItcButton
            variant="secondary"
            onClick={() => setCerrarTarget(true)}
            disabled={proceso.estado === "cerrado"}
          >
            Cerrar seguimiento
          </ItcButton>
        </div>
      </div>

      <ItcTabs
        items={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          children: (
            <div className="rounded-2xl border bg-card p-6">
              {t.key === "analisis-ia" && (
                <AnalisisIaTab
                  procesoId={proceso.id}
                  analisis={analisisIa}
                />
              )}
              {t.key === "asistente-ia" && (
                <AsistenteIaTab
                  procesoId={proceso.id}
                  directLineBaseUrl={directLineBaseUrl}
                />
              )}
              {t.key === "matriz-cumplimiento" && (
                <MatrizCumplimientoTab analisis={analisisIa} />
              )}
              {t.key === "tareas" && (
                <TareasTab
                  procesoId={proceso.id}
                  tareas={tareas}
                  usuariosAsignables={usuariosAsignables}
                />
              )}
              {t.key === "crm" && (
                <CrmTab proceso={proceso} documentosCrm={documentosCrm} />
              )}
            </div>
          ),
        }))}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      />

      <ItcModal
        open={cerrarTarget}
        onClose={() => setCerrarTarget(false)}
        onConfirm={handleCerrar}
        title="¿Cerrar seguimiento?"
        content={
          <p className="text-sm text-muted-foreground">
            El proceso{" "}
            <span className="font-medium">{proceso.titulo ?? proceso.secopId}</span>{" "}
            se marcará como cerrado y no podrá editarse.
          </p>
        }
        variant="confirm"
        confirmText="Cerrar"
        disabled={isPending}
      />
    </div>
  );
}
