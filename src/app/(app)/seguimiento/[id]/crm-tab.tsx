"use client";

import { useTransition, useState } from "react";
import { ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import { type ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";
import {
  crearOportunidadCrm,
  reintentarDescargaDocumentosCrm,
  type OportunidadDocumentoRow,
} from "./crm-actions";

const DOCUMENTO_ESTADO_LABEL: Record<OportunidadDocumentoRow["estado"], string> = {
  pendiente: "Pendiente",
  descargado: "Copiado",
  error: "Error",
};

const DOCUMENTO_ESTADO_TONE: Record<OportunidadDocumentoRow["estado"], Tone> = {
  pendiente: "muted",
  descargado: "success",
  error: "danger",
};

function DocumentosSecopStatus({
  procesoId,
  documentosCrm,
}: {
  procesoId: string;
  documentosCrm: OportunidadDocumentoRow[];
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [isRetrying, startRetry] = useTransition();

  const descargados = documentosCrm.filter((d) => d.estado === "descargado").length;
  const errores = documentosCrm.filter((d) => d.estado === "error").length;
  const pendientes = documentosCrm.filter((d) => d.estado === "pendiente").length;

  const handleReintentar = () => {
    startRetry(async () => {
      try {
        await reintentarDescargaDocumentosCrm(procesoId);
        toast.success("Sincronización programada — puede tardar unos minutos");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo programar la sincronización",
        );
      }
    });
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">Documentos de SECOP</h4>
        <div className="flex items-center gap-2">
          {documentosCrm.length > 0 && (
            <ItcButton
              variant={errores > 0 ? "warning" : "secondary"}
              size="sm"
              iconLeft={<RotateCcw className="h-3.5 w-3.5" />}
              loading={isRetrying}
              onClick={handleReintentar}
            >
              Reintentar sincronización
            </ItcButton>
          )}
          <ItcButton
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw className="h-3.5 w-3.5" />}
            loading={isRefreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            Actualizar
          </ItcButton>
        </div>
      </div>

      {documentosCrm.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay documentos copiados a la Oportunidad. La copia se hace en
          segundo plano y puede tardar unos minutos — usa &ldquo;Actualizar&rdquo;
          para revisar el estado.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {descargados} copiado{descargados === 1 ? "" : "s"}
            {pendientes > 0 && `, ${pendientes} pendiente${pendientes === 1 ? "" : "s"}`}
            {errores > 0 && `, ${errores} con error`}
          </p>
          <ul className="space-y-1.5">
            {documentosCrm.map((doc) => (
              <li
                key={doc.documentoId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate" title={doc.nombreArchivo}>
                  {doc.nombreArchivo}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {doc.estado === "error" && doc.errorMensaje && (
                    <span
                      className="max-w-[16rem] truncate text-xs text-destructive"
                      title={doc.errorMensaje}
                    >
                      {doc.errorMensaje}
                    </span>
                  )}
                  <StatusBadge tone={DOCUMENTO_ESTADO_TONE[doc.estado]}>
                    {DOCUMENTO_ESTADO_LABEL[doc.estado]}
                  </StatusBadge>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function CrmTab({
  proceso,
  documentosCrm,
}: {
  proceso: ProcesoSeguimientoRow;
  documentosCrm: OportunidadDocumentoRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tema, setTema] = useState(proceso.titulo ?? proceso.secopId ?? "");
  const [creada, setCreada] = useState<{
    opportunityId: string;
    opportunityUrl: string | null;
  } | null>(
    proceso.crmOpportunityId
      ? {
          opportunityId: proceso.crmOpportunityId,
          opportunityUrl: proceso.crmOpportunityUrl,
        }
      : null,
  );

  const handleCrear = () => {
    startTransition(async () => {
      try {
        const result = await crearOportunidadCrm(proceso.id, tema);
        setCreada(result);
        toast.success("Oportunidad creada en el CRM");
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo crear la oportunidad",
        );
      }
    });
  };

  if (creada) {
    return (
      <div className="space-y-3">
        <StatusBadge tone="success">Oportunidad creada</StatusBadge>
        <p className="text-sm text-muted-foreground">
          ID: {creada.opportunityId}
        </p>
        {proceso.crmCreatedAt && (
          <p className="text-sm text-muted-foreground">
            Creada:{" "}
            {new Date(proceso.crmCreatedAt).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        {creada.opportunityUrl && (
          <a
            href={creada.opportunityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Abrir en CRM
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <DocumentosSecopStatus procesoId={proceso.id} documentosCrm={documentosCrm} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tema</Label>
        <ItcInput
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          maxLength={300}
        />
      </div>

      <div className="space-y-2">
        <Label>Descripción (objeto del proceso)</Label>
        <Textarea
          readOnly
          value={proceso.objeto ?? ""}
          placeholder="El proceso no tiene objeto registrado"
          className="min-h-[80px] resize-none bg-muted/50"
        />
      </div>

      <ItcButton onClick={handleCrear} disabled={isPending || tema.trim().length === 0}>
        {isPending ? "Creando…" : "Crear oportunidad"}
      </ItcButton>
    </div>
  );
}
