"use client";

import { useTransition, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/layout/status-badge";
import { type ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";
import { crearOportunidadCrm } from "./crm-actions";

export function CrmTab({ proceso }: { proceso: ProcesoSeguimientoRow }) {
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
