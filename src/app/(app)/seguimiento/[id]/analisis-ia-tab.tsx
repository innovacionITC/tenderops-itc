"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { ItcButton } from "@/components/itc";
import { StatusBadge } from "@/components/layout/status-badge";
import { ejecutarAnalisisIa } from "./analisis-ia-actions";

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

export function AnalisisIaTab({
  procesoId,
  analisis,
}: {
  procesoId: string;
  analisis: AnalisisIa | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AnalisisIa | null>(analisis);

  const handleEjecutar = () => {
    startTransition(async () => {
      try {
        const r = await ejecutarAnalisisIa(procesoId);
        setResult(r);
        toast.success("Análisis completado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo ejecutar el análisis");
      }
    });
  };

  const current = result ?? analisis;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ItcButton onClick={handleEjecutar} disabled={isPending}>
          {isPending ? "Analizando…" : "Ejecutar análisis"}
        </ItcButton>
      </div>

      {current ? (
        <div className="space-y-4">
          {current.summary && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Resumen</h4>
              <p className="mt-1 text-sm">{current.summary}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {current.opportunityLevel && (
              <StatusBadge tone={current.opportunityLevel === "alto" ? "success" : "muted"}>
                Oportunidad: {current.opportunityLevel}
              </StatusBadge>
            )}
            {current.riskLevel && (
              <StatusBadge tone={current.riskLevel === "alto" ? "danger" : "muted"}>
                Riesgo: {current.riskLevel}
              </StatusBadge>
            )}
            {current.complexityLevel && (
              <StatusBadge tone="muted">Complejidad: {current.complexityLevel}</StatusBadge>
            )}
          </div>
          {current.fit && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Fit</h4>
              <p className="mt-1 text-sm">{current.fit}</p>
            </div>
          )}
          {current.alerts && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Alertas</h4>
              <p className="mt-1 text-sm text-destructive">{current.alerts}</p>
            </div>
          )}
          {current.recommendation && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Recomendación</h4>
              <p className="mt-1 text-sm">{current.recommendation}</p>
            </div>
          )}
          {current.suggestedModality && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Modalidad sugerida</h4>
              <p className="mt-1 text-sm">{current.suggestedModality}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ejecuta un análisis para ver los resultados.
        </p>
      )}
    </div>
  );
}
