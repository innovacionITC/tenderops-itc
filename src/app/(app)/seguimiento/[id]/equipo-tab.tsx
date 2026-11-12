"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/layout/status-badge";
import { MATCH_LABELS, type MatchOutcome, type Professional, type ProfessionalRecord } from "@/lib/perfiles/contracts";
import {
  assignToProcessAction,
  getPerfilAction,
  listTenderTeamAction,
  searchProfessionalsAction,
} from "@/app/(app)/perfiles/actions";
import type { ProcesoSeguimientoRow } from "@/lib/seguimiento-shared";

function tone(outcome: MatchOutcome) {
  if (outcome === "cumple") return "success" as const;
  if (outcome === "no_cumple") return "danger" as const;
  if (outcome === "cumple_parcial") return "warning" as const;
  return "muted" as const;
}

export function EquipoTab({ proceso }: { proceso: ProcesoSeguimientoRow }) {
  const router = useRouter();
  const [team, setTeam] = useState<ProfessionalRecord[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Professional[]>([]);
  const [selected, setSelected] = useState<ProfessionalRecord | null>(null);
  const [roleName, setRoleName] = useState("");
  const [generalMonths, setGeneralMonths] = useState("0");
  const [specificMonths, setSpecificMonths] = useState("0");
  const [specificCriteria, setSpecificCriteria] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadTeam = () => {
    listTenderTeamAction(proceso.id).then(setTeam).catch((error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el equipo");
    });
  };

  useEffect(() => {
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proceso.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Equipo propuesto</h2>
        <p className="text-sm text-muted-foreground">
          El banco de perfiles opera de forma independiente. Aquí solo se asocian profesionales reales de la
          organización al proceso {proceso.secopId ?? proceso.id}.
        </p>
      </div>

      {team.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay profesionales asociados a este proceso.</p>
      ) : (
        <ul className="grid gap-3">
          {team.map((item) => {
            const assignment = item.tenderAssignments.find((row) => row.tenderId === proceso.id);
            const match = assignment?.match;
            return (
              <li key={item.professional.id} className="crystal-surface rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{item.professional.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {assignment?.roleName} · {item.professional.profession}
                    </div>
                  </div>
                  {match && <StatusBadge tone={tone(match.outcome)}>{MATCH_LABELS[match.outcome]}</StatusBadge>}
                </div>
                {match && (
                  <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                    {match.reasons.slice(0, 4).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                    {match.missingSupports.length > 0 && (
                      <li>Pendiente de verificar / sin soporte: {match.missingSupports.join(", ")}</li>
                    )}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <ItcButton
                    className="text-xs"
                    href={`/perfiles?profesional=${item.professional.id}&hv=1&proceso=${proceso.id}`}
                  >
                    Generar hoja de vida
                  </ItcButton>
                  {item.generatedResumes
                    .filter((resume) => resume.tenderId === proceso.id)
                    .slice(0, 3)
                    .map((resume) => (
                      <ItcButton
                        key={resume.id}
                        className="text-xs"
                        variant="secondary"
                        href={`/api/perfiles/resumes/${item.professional.id}/${resume.id}`}
                      >
                        HV v{resume.version}
                      </ItcButton>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-2xl border p-4">
        <h3 className="text-sm font-semibold">Asociar profesional</h3>
        <div className="mt-3 flex gap-2">
          <ItcInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en el banco" />
          <ItcButton
            onClick={() => {
              startTransition(async () => setHits(await searchProfessionalsAction(query)));
            }}
          >
            Buscar
          </ItcButton>
        </div>
        <ul className="mt-2 grid gap-2">
          {hits.map((item) => (
            <li key={item.id}>
              <button
                className="w-full rounded-xl border px-3 py-2 text-left text-sm"
                onClick={() => {
                  getPerfilAction(item.id).then(setSelected);
                  setRoleName(item.primaryProfile || item.profession);
                }}
              >
                {item.fullName} · {item.profession}
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <div className="mt-4 grid gap-3">
            <p className="text-sm">
              Seleccionado: <strong>{selected.professional.fullName}</strong>
            </p>
            <div>
              <Label className="mb-1.5">Cargo a presentar</Label>
              <ItcInput value={roleName} onChange={(event) => setRoleName(event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5">Meses de experiencia general exigidos</Label>
                <ItcInput value={generalMonths} onChange={(event) => setGeneralMonths(event.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5">Meses de experiencia específica</Label>
                <ItcInput value={specificMonths} onChange={(event) => setSpecificMonths(event.target.value)} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5">Criterio de experiencia específica</Label>
              <ItcInput
                value={specificCriteria}
                onChange={(event) => setSpecificCriteria(event.target.value)}
                placeholder="Palabras del pliego: Azure, interventoría…"
              />
            </div>
            <ItcButton
              disabled={isPending || !roleName.trim()}
              onClick={() => {
                startTransition(async () => {
                  try {
                    const assignment = await assignToProcessAction({
                      professionalId: selected.professional.id,
                      tenderId: proceso.id,
                      roleName,
                      generalMonths: Number(generalMonths) || 0,
                      specificMonths: Number(specificMonths) || 0,
                      specificCriteria,
                    });
                    toast.success(
                      `Asociado como ${assignment.roleName}. Cumplimiento: ${assignment.match ? MATCH_LABELS[assignment.match.outcome] : "sin evaluar"}`,
                    );
                    setSelected(null);
                    setHits([]);
                    loadTeam();
                    router.refresh();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "No se pudo asociar");
                  }
                });
              }}
            >
              Asociar al proceso
            </ItcButton>
          </div>
        )}
      </div>
    </div>
  );
}
