"use client";

import { useTransition, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
        <label className="block text-xs font-medium text-muted-foreground">
          Tema
        </label>
        <input
          type="text"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          maxLength={300}
          className="h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Descripción (objeto del proceso)
        </label>
        <textarea
          readOnly
          value={proceso.objeto ?? ""}
          placeholder="El proceso no tiene objeto registrado"
          className="min-h-[80px] w-full rounded-lg border bg-muted/50 px-2.5 py-1.5 text-sm outline-none resize-none"
        />
      </div>

      <button
        onClick={handleCrear}
        disabled={isPending || tema.trim().length === 0}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Creando…" : "Crear oportunidad"}
      </button>
    </div>
  );
}
