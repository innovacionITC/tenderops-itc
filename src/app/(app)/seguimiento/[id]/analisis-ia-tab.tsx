"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ItcButton, ItcTable, type TableColumn } from "@/components/itc";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import {
  getEstadoAnalisis,
  getResultadoAnalisis,
  listVersionesAnalisis,
  solicitarAnalisis,
  type DocumentoAnalisis,
  type EstadoAnalisis,
  type EstadoAnalisisLicitacion,
  type ResultadoAnalisis,
  type VersionAnalisis,
} from "./analisis-ia-actions";
import { ResultadoAnalisisLicitacion } from "./analisis-ia-resultado";

const INTERVALO_CONSULTA_MS = 5_000;

const ESTADOS_FINALES: EstadoAnalisisLicitacion[] = ["COMPLETADO", "REQUIERE_REVISION", "ERROR"];

// Si la evaluación está apagada en el ambiente, el análisis termina después de
// organizar las evidencias y las dos últimas etapas no se recorren.
const ETAPAS: { estado: EstadoAnalisisLicitacion; label: string }[] = [
  { estado: "INVENTARIANDO", label: "Inventario de documentos" },
  { estado: "EXTRAYENDO", label: "Lectura de documentos" },
  { estado: "NORMALIZANDO", label: "Organización de evidencias" },
  { estado: "EVALUANDO", label: "Lectura integral con IA" },
  { estado: "VALIDANDO", label: "Evaluación y recomendación" },
];

const ESTADO_LABEL: Record<EstadoAnalisisLicitacion, string> = {
  PENDIENTE: "En cola",
  INVENTARIANDO: "Inventariando",
  EXTRAYENDO: "Leyendo documentos",
  NORMALIZANDO: "Organizando evidencias",
  EVALUANDO: "Evaluando",
  VALIDANDO: "Validando",
  COMPLETADO: "Completado",
  REQUIERE_REVISION: "Requiere revisión",
  ERROR: "Error",
};

const ESTADO_TONE: Record<EstadoAnalisisLicitacion, Tone> = {
  PENDIENTE: "muted",
  INVENTARIANDO: "info",
  EXTRAYENDO: "info",
  NORMALIZANDO: "info",
  EVALUANDO: "info",
  VALIDANDO: "info",
  COMPLETADO: "success",
  REQUIERE_REVISION: "warning",
  ERROR: "danger",
};

const DOCUMENTO_LABEL: Record<DocumentoAnalisis["estado"], { label: string; tone: Tone }> = {
  INCLUIDO: { label: "Pendiente de lectura", tone: "muted" },
  LEIDO: { label: "Leído", tone: "success" },
  FALLIDO: { label: "No se pudo leer", tone: "danger" },
  EXCLUIDO: { label: "Excluido", tone: "warning" },
  FALTANTE: { label: "Faltante", tone: "warning" },
};

const esFinal = (estado: EstadoAnalisisLicitacion) => ESTADOS_FINALES.includes(estado);

export type AnalisisIaPrevio = {
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
  estadoInicial,
  versionesIniciales,
  resultadoInicial,
  analisisPrevio,
}: {
  procesoId: string;
  estadoInicial: EstadoAnalisis | null;
  versionesIniciales: VersionAnalisis[];
  resultadoInicial: ResultadoAnalisis | null;
  analisisPrevio: AnalisisIaPrevio | null;
}) {
  const [estado, setEstado] = useState<EstadoAnalisis | null>(estadoInicial);
  const [versiones, setVersiones] = useState<VersionAnalisis[]>(versionesIniciales);
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(resultadoInicial);
  const [forzar, setForzar] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enCurso = estado !== null && !esFinal(estado.estado);

  const refrescar = useCallback(async () => {
    const actual = await getEstadoAnalisis(procesoId);
    setEstado(actual);
    if (actual && esFinal(actual.estado)) {
      const [versionesActuales, resultadoActual] = await Promise.all([
        listVersionesAnalisis(procesoId),
        getResultadoAnalisis(procesoId),
      ]);
      setVersiones(versionesActuales);
      setResultado(resultadoActual);
    } else {
      // Mientras corre una versión nueva no se muestra el resultado de la anterior.
      setResultado(null);
    }
    return actual;
  }, [procesoId]);

  useEffect(() => {
    if (!enCurso) return;

    const intervalo = setInterval(() => {
      refrescar()
        .then((actual) => {
          if (actual?.estado === "COMPLETADO") toast.success("El análisis terminó.");
          else if (actual?.estado === "REQUIERE_REVISION") toast.warning("El análisis terminó y requiere revisión.");
          else if (actual?.estado === "ERROR") toast.error("El análisis no pudo completarse.");
        })
        .catch(() => {
          // Un fallo puntual de red no corta la consulta: se reintenta en el siguiente ciclo.
        });
    }, INTERVALO_CONSULTA_MS);

    return () => clearInterval(intervalo);
  }, [enCurso, refrescar]);

  const handleEjecutar = () => {
    startTransition(async () => {
      try {
        await solicitarAnalisis(procesoId, forzar);
        toast.success("Análisis solicitado: se procesa en segundo plano.");
        setForzar(false);
        await refrescar();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo solicitar el análisis");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Lee todos los documentos del proceso que ya están en la oportunidad del CRM, los organiza en
          evidencias citables y evalúa el cumplimiento de xRM e Intelecto con el Playbook de licitaciones:
          semáforo, figura recomendada, brechas y acciones.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="forzar-analisis"
              checked={forzar}
              onCheckedChange={(v) => setForzar(v === true)}
              disabled={enCurso || isPending}
            />
            <Label htmlFor="forzar-analisis" className="text-sm font-normal">
              Forzar nuevo análisis
            </Label>
          </div>
          <ItcButton onClick={handleEjecutar} loading={isPending} disabled={enCurso || isPending}>
            {enCurso ? "Análisis en curso…" : "Ejecutar análisis"}
          </ItcButton>
        </div>
      </div>

      {estado ? <EstadoActual estado={estado} /> : (
        <p className="text-sm text-muted-foreground">Todavía no se ha ejecutado un análisis para este proceso.</p>
      )}

      {resultado && <ResultadoAnalisisLicitacion procesoId={procesoId} resultado={resultado} />}

      {estado && estado.documentos.length > 0 && <InventarioDocumentos documentos={estado.documentos} />}

      {versiones.length > 1 && <VersionesAnteriores versiones={versiones} actualId={estado?.id} />}

      {analisisPrevio && <AnalisisPrevio analisis={analisisPrevio} />}
    </div>
  );
}

function EstadoActual({ estado }: { estado: EstadoAnalisis }) {
  const final = esFinal(estado.estado);
  const indiceActual = ETAPAS.findIndex((e) => e.estado === estado.estado);

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Versión {estado.version}</span>
        <StatusBadge tone={ESTADO_TONE[estado.estado]}>{ESTADO_LABEL[estado.estado]}</StatusBadge>
        {estado.versionReutilizada !== null && (
          <StatusBadge tone="info">Reutilizado de la versión {estado.versionReutilizada}</StatusBadge>
        )}
        {estado.cobertura !== null && (
          <StatusBadge tone={estado.cobertura >= 1 ? "success" : "warning"}>
            Cobertura {Math.round(estado.cobertura * 100)} %
          </StatusBadge>
        )}
        <span className="text-xs text-muted-foreground">Solicitado el {formatDate(estado.solicitadoEn)}</span>
      </div>

      {!final && (
        <ol className="grid gap-2 sm:grid-cols-5">
          {ETAPAS.map((etapa, i) => {
            const hecha = indiceActual > i;
            const actual = indiceActual === i;
            return (
              <li
                key={etapa.estado}
                className={`rounded-lg border px-3 py-2 text-sm ${actual ? "border-primary bg-primary/5" : ""} ${hecha ? "text-muted-foreground" : ""}`}
              >
                <span className="font-medium">{i + 1}. {etapa.label}</span>
                {actual && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${estado.progreso}%` }} />
                  </div>
                )}
                {hecha && <span className="ml-1 text-xs">✓</span>}
              </li>
            );
          })}
        </ol>
      )}

      {estado.mensaje && <p className="text-sm">{estado.mensaje}</p>}

      {estado.estado === "ERROR" && (
        <p className="text-sm text-destructive">
          Código {estado.errorCodigo ?? "—"} · correlación {estado.correlationId}. Comparte estos datos con soporte.
        </p>
      )}

      {estado.sharePointCarpeta && (
        <p className="text-xs text-muted-foreground">
          Copia del análisis en la carpeta de la oportunidad: <span className="font-mono">{estado.sharePointCarpeta}</span>
        </p>
      )}
    </div>
  );
}

function InventarioDocumentos({ documentos }: { documentos: DocumentoAnalisis[] }) {
  const columns: TableColumn<DocumentoAnalisis>[] = [
    {
      key: "nombre",
      title: "Documento",
      width: "38%",
      render: (d) => <span className="block truncate text-sm" title={d.nombre}>{d.nombre}</span>,
    },
    {
      key: "estado",
      title: "Estado",
      width: "16%",
      render: (d) => <StatusBadge tone={DOCUMENTO_LABEL[d.estado].tone}>{DOCUMENTO_LABEL[d.estado].label}</StatusBadge>,
    },
    {
      key: "paginas",
      title: "Páginas",
      width: "16%",
      render: (d) =>
        d.paginas ? (
          <span className="text-sm" title={`${d.paginasNativas ?? 0} con texto · ${d.paginasMixtas ?? 0} mixtas · ${d.paginasOcr ?? 0} escaneadas`}>
            {d.paginas}
            {(d.paginasOcr ?? 0) + (d.paginasMixtas ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground"> ({(d.paginasOcr ?? 0) + (d.paginasMixtas ?? 0)} con OCR)</span>
            )}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "motivo",
      title: "Observación",
      width: "30%",
      render: (d) => (
        <span className="block truncate text-sm text-muted-foreground" title={d.motivo ?? undefined}>
          {d.motivo ?? (d.tipoDocumento ? `Tipo: ${d.tipoDocumento.replace("_", " ")}` : "—")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Documentos del expediente</h4>
      <ItcTable
        data={documentos}
        columns={columns}
        rowKey={(d) => d.id}
        pagination={false}
        tableLayout="fixed"
        responsiveStrategy="cards"
        striped
      />
    </div>
  );
}

function VersionesAnteriores({ versiones, actualId }: { versiones: VersionAnalisis[]; actualId?: string }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Versiones anteriores</h4>
      <ul className="space-y-1 text-sm">
        {versiones
          .filter((v) => v.id !== actualId)
          .map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2">
              <span>Versión {v.version}</span>
              <StatusBadge tone={ESTADO_TONE[v.estado]}>{ESTADO_LABEL[v.estado]}</StatusBadge>
              <span className="text-xs text-muted-foreground">{formatDate(v.solicitadoEn)}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

// Resultado del flujo anterior (síncrono por Direct Line). Se mantiene visible
// hasta la fase 4, que retira ai_evaluations; la pestaña Matriz todavía lo usa.
function AnalisisPrevio({ analisis }: { analisis: AnalisisIaPrevio }) {
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Análisis anterior (formato previo) · {formatDate(analisis.createdAt)}
      </summary>
      <div className="mt-4 space-y-4">
        {analisis.summary && <Campo titulo="Resumen">{analisis.summary}</Campo>}
        <div className="flex flex-wrap gap-2">
          {analisis.opportunityLevel && (
            <StatusBadge tone={analisis.opportunityLevel === "alto" ? "success" : "muted"}>
              Oportunidad: {analisis.opportunityLevel}
            </StatusBadge>
          )}
          {analisis.riskLevel && (
            <StatusBadge tone={analisis.riskLevel === "alto" ? "danger" : "muted"}>Riesgo: {analisis.riskLevel}</StatusBadge>
          )}
          {analisis.complexityLevel && <StatusBadge tone="muted">Complejidad: {analisis.complexityLevel}</StatusBadge>}
        </div>
        {analisis.fit && <Campo titulo="Fit">{analisis.fit}</Campo>}
        {analisis.alerts && <Campo titulo="Alertas" destacado>{analisis.alerts}</Campo>}
        {analisis.recommendation && <Campo titulo="Recomendación">{analisis.recommendation}</Campo>}
        {analisis.suggestedModality && <Campo titulo="Modalidad sugerida">{analisis.suggestedModality}</Campo>}
      </div>
    </details>
  );
}

function Campo({ titulo, destacado, children }: { titulo: string; destacado?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground">{titulo}</h4>
      <p className={`mt-1 text-sm ${destacado ? "text-destructive" : ""}`}>{children}</p>
    </div>
  );
}
