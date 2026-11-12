"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Professional, ProfessionalRecord, ResumeFormat, ResumeSelection } from "@/lib/perfiles/contracts";
import { buildResumePreview } from "@/lib/perfiles/preview";
import {
  generateResumeAction,
  getPerfilAction,
  listProcesosForPerfilesAction,
  saveEntityTemplateAction,
  searchProfessionalsAction,
} from "./actions";

const STEPS = [
  "Profesional",
  "Cargo",
  "Formación",
  "Experiencias",
  "Certificaciones",
  "Acreditaciones",
  "Vista previa",
  "Generar",
];

export function ResumeBuilder({
  open,
  onOpenChange,
  initialProfessionalId,
  initialTenderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProfessionalId: string | null;
  initialTenderId: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Professional[]>([]);
  const [record, setRecord] = useState<ProfessionalRecord | null>(null);
  const [proposedRole, setProposedRole] = useState("");
  const [tenderId, setTenderId] = useState(initialTenderId ?? "");
  const [tenders, setTenders] = useState<{ id: string; label: string; entidad: string | null }[]>([]);
  const [format, setFormat] = useState<ResumeFormat>("corporativo");
  const [selection, setSelection] = useState<ResumeSelection>(emptySelection());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    listProcesosForPerfilesAction().then(setTenders).catch(() => setTenders([]));
    if (initialProfessionalId) {
      getPerfilAction(initialProfessionalId).then((loaded) => {
        setRecord(loaded);
        setProposedRole(loaded.professional.primaryProfile || loaded.professional.profession);
        setSelection(selectionFrom(loaded));
      });
    }
  }, [open, initialProfessionalId]);

  const preview = useMemo(() => {
    if (!record) return { months: 0, html: "<p>Seleccione un profesional.</p>" };
    const proceso = tenders.find((item) => item.id === tenderId);
    return buildResumePreview(record, selection, proposedRole, proceso?.label ?? "");
  }, [record, selection, proposedRole, tenderId, tenders]);

  const toggle = (list: keyof Pick<ResumeSelection, "educationIds" | "experienceIds" | "certificationIds" | "licenseIds">, id: string) => {
    setSelection((current) => ({
      ...current,
      [list]: current[list].includes(id) ? current[list].filter((item) => item !== id) : [...current[list], id],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-[92vw] sm:max-w-[92vw]">
        <SheetTitle>Generador de hojas de vida</SheetTitle>
        <SheetDescription>
          No imprime la ficha completa: solo los estudios, experiencias y certificaciones que usted marque.
        </SheetDescription>
        <ol className="mt-3 flex flex-wrap gap-1 text-[11px]">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={`rounded-full px-2 py-0.5 ${index === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {step === 0 && (
              <div className="space-y-2">
                <Label>Buscar profesional del banco</Label>
                <div className="flex gap-2">
                  <ItcInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o profesión" />
                  <ItcButton
                    onClick={() => {
                      startTransition(async () => setHits(await searchProfessionalsAction(query)));
                    }}
                  >
                    Buscar
                  </ItcButton>
                </div>
                <ul className="grid gap-2">
                  {hits.map((item) => (
                    <li key={item.id}>
                      <button
                        className={`w-full rounded-2xl border px-3 py-2 text-left text-sm ${record?.professional.id === item.id ? "border-primary bg-primary/5" : "bg-white/60"}`}
                        onClick={() => {
                          getPerfilAction(item.id).then((loaded) => {
                            setRecord(loaded);
                            setProposedRole(loaded.professional.primaryProfile || loaded.professional.profession);
                            setSelection(selectionFrom(loaded));
                          });
                        }}
                      >
                        <div className="font-medium">{item.fullName}</div>
                        <div className="text-xs text-muted-foreground">{item.profession}</div>
                      </button>
                    </li>
                  ))}
                </ul>
                {record && <p className="text-sm">Seleccionado: {record.professional.fullName}</p>}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5">Cargo o perfil a presentar</Label>
                  <ItcInput value={proposedRole} onChange={(event) => setProposedRole(event.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5">Proceso de seguimiento (opcional)</Label>
                  <ItcInput type="select" value={tenderId} onChange={(event) => setTenderId(event.target.value)}>
                    <option value="">Sin asociar a licitación</option>
                    {tenders.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </ItcInput>
                </div>
                <div>
                  <Label className="mb-1.5">Plantilla</Label>
                  <ItcInput type="select" value={format} onChange={(event) => setFormat(event.target.value as ResumeFormat)}>
                    <option value="corporativo">Corporativa TenderOps</option>
                    <option value="entidad">Formato de entidad (DOCX con variables)</option>
                  </ItcInput>
                </div>
                {format === "entidad" && (
                  <input
                    type="file"
                    accept=".docx"
                    className="block w-full text-sm"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.set("file", file);
                      startTransition(async () => {
                        await saveEntityTemplateAction(fd);
                        toast.success("Plantilla de entidad cargada");
                      });
                    }}
                  />
                )}
                <Label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selection.includeSummary}
                    onChange={(event) => setSelection((current) => ({ ...current, includeSummary: event.target.checked }))}
                  />
                  Incluir resumen
                </Label>
                {selection.includeSummary && (
                  <ItcInput
                    value={selection.summary}
                    onChange={(event) => setSelection((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Resumen profesional (no invente experiencia)"
                  />
                )}
              </div>
            )}

            {step === 2 && record && (
              <Checklist
                items={record.education.map((item) => ({
                  id: item.id,
                  label: `${item.title} · ${item.institution}`,
                  hint: item.graduatedOn ?? item.status,
                }))}
                selected={selection.educationIds}
                onToggle={(id) => toggle("educationIds", id)}
                empty="Este profesional no tiene estudios registrados."
              />
            )}
            {step === 3 && record && (
              <>
                <p className="text-xs text-muted-foreground">
                  Meses netos de la selección actual: {preview.months}. Los periodos simultáneos no se suman dos veces.
                </p>
                <Checklist
                  items={record.experiences.map((item) => ({
                    id: item.id,
                    label: `${item.role} · ${item.client}`,
                    hint: `${item.project} · ${item.startedOn} – ${item.endedOn ?? "actual"}${item.supportRef ? "" : " · sin soporte"}`,
                  }))}
                  selected={selection.experienceIds}
                  onToggle={(id) => toggle("experienceIds", id)}
                  empty="Este profesional no tiene experiencias registradas."
                />
              </>
            )}
            {step === 4 && record && (
              <Checklist
                items={record.certifications.map((item) => ({
                  id: item.id,
                  label: `${item.name} · ${item.issuer}`,
                  hint: item.validity === "vencida" ? "VENCIDA" : (item.expiresOn ?? "sin fecha"),
                  warn: item.validity === "vencida",
                }))}
                selected={selection.certificationIds}
                onToggle={(id) => toggle("certificationIds", id)}
                empty="Sin certificaciones."
              />
            )}
            {step === 5 && record && (
              <Checklist
                items={record.licenses.map((item) => ({
                  id: item.id,
                  label: `${item.kind} · ${item.issuer} · ${item.number}`,
                  hint: item.status,
                }))}
                selected={selection.licenseIds}
                onToggle={(id) => toggle("licenseIds", id)}
                empty="Sin acreditaciones."
              />
            )}
            {step >= 6 && (
              <p className="text-sm">
                Revise la vista previa a la derecha. Generar crea un DOCX real, lo guarda en Storage y deja una versión
                inmutable en el historial.
              </p>
            )}
          </div>

          <div className="crystal-surface min-h-[28rem] rounded-3xl p-5">
            <h3 className="mb-3 text-sm font-semibold">Vista previa</h3>
            <div className="resume-preview space-y-2 text-slate-800" dangerouslySetInnerHTML={{ __html: preview.html }} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <ItcButton variant="secondary" onClick={() => (step === 0 ? onOpenChange(false) : setStep((value) => value - 1))}>
            {step === 0 ? "Cancelar" : "Atrás"}
          </ItcButton>
          {step < 7 ? (
            <ItcButton disabled={!record || (step === 1 && !proposedRole.trim())} onClick={() => setStep((value) => value + 1)}>
              Continuar
            </ItcButton>
          ) : (
            <ItcButton
              disabled={isPending || !record || !proposedRole.trim()}
              onClick={() => {
                if (!record) return;
                startTransition(async () => {
                  try {
                    const resume = await generateResumeAction({
                      professionalId: record.professional.id,
                      proposedRoleName: proposedRole,
                      tenderId: tenderId || null,
                      format,
                      selection,
                    });
                    toast.success(`Hoja de vida v${resume.version} generada. La descarga comienza ahora.`);
                    router.refresh();
                    onOpenChange(false);
                    const link = document.createElement("a");
                    link.href = `/api/perfiles/resumes/${record.professional.id}/${resume.id}`;
                    link.download = "";
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "No se pudo generar");
                  }
                });
              }}
            >
              Generar DOCX
            </ItcButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function emptySelection(): ResumeSelection {
  return {
    includeName: true,
    includeIdentification: false,
    includeProfession: true,
    includeSpecialty: true,
    includeCity: true,
    includeContact: false,
    includeSummary: false,
    educationIds: [],
    experienceIds: [],
    certificationIds: [],
    licenseIds: [],
    attachmentIds: [],
    experienceOrder: "reciente",
    summary: "",
  };
}

function selectionFrom(record: ProfessionalRecord): ResumeSelection {
  return {
    ...emptySelection(),
    educationIds: record.education.map((item) => item.id),
    experienceIds: [],
    certificationIds: record.certifications.filter((item) => item.validity !== "vencida").map((item) => item.id),
    licenseIds: record.licenses.map((item) => item.id),
  };
}

function Checklist({
  items,
  selected,
  onToggle,
  empty,
}: {
  items: { id: string; label: string; hint?: string; warn?: boolean }[];
  selected: string[];
  onToggle: (id: string) => void;
  empty: string;
}) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/60 px-3 py-2 text-sm">
            <input type="checkbox" className="mt-1" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
            <span>
              <span className="font-medium">{item.label}</span>
              {item.hint ? (
                <span className={`block text-xs ${item.warn ? "text-amber-700" : "text-muted-foreground"}`}>{item.hint}</span>
              ) : null}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
