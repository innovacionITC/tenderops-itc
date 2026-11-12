"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ItcButton } from "@/components/itc";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import {
  AVAILABILITY_LABELS,
  VERIFICATION_LABELS,
  type ProfessionalConsent,
  type ProfessionalRecord,
} from "@/lib/perfiles/contracts";
import {
  approveResumeAction,
  getPerfilAction,
  regenerateResumeAction,
  saveCertificationsAction,
  saveConsentAction,
  saveEducationAction,
  saveExperiencesAction,
  saveLicensesAction,
  savePerfilAction,
  saveSkillsAction,
  uploadAttachmentAction,
} from "./actions";
import {
  CertificationEditor,
  EducationEditor,
  ExperienceEditor,
  LicenseEditor,
  SkillEditor,
} from "./collection-editors";

export function ProfessionalDetailSheet({
  professionalId,
  open,
  onOpenChange,
  canEdit,
  canApprove,
  onGenerate,
}: {
  professionalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canApprove: boolean;
  onGenerate: () => void;
}) {
  const router = useRouter();
  const [record, setRecord] = useState<ProfessionalRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const loading = Boolean(open && professionalId && record?.professional.id !== professionalId);

  useEffect(() => {
    if (!open || !professionalId) return;
    let cancelled = false;
    getPerfilAction(professionalId)
      .then((data) => {
        if (!cancelled) setRecord(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar la ficha");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, professionalId]);

  const reload = () => {
    if (!professionalId) return;
    getPerfilAction(professionalId).then(setRecord).then(() => router.refresh());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl">
        <SheetTitle>{record?.professional.fullName ?? "Ficha del profesional"}</SheetTitle>
        <SheetDescription>
          Los cambios se guardan en Supabase de la organización activa. El documento de identidad permanece enmascarado.
        </SheetDescription>
        {loading && <p className="mt-4 text-sm text-muted-foreground">Cargando ficha…</p>}
        {record && (
          <div className="mt-4 space-y-6">
            <section className="crystal-surface space-y-2 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge>{AVAILABILITY_LABELS[record.professional.availability]}</StatusBadge>
                <StatusBadge>{VERIFICATION_LABELS[record.professional.verification]}</StatusBadge>
                <span className="text-xs text-muted-foreground">Actualizado {formatDate(record.professional.updatedAt)}</span>
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Item label="Documento" value={`${record.professional.documentType} ${record.professional.documentNumberMasked || "****"}`} />
                <Item label="Correo" value={record.professional.emailMasked ?? "—"} />
                <Item label="Teléfono" value={record.professional.phoneMasked ?? "—"} />
                <Item label="Profesión" value={record.professional.profession || "—"} />
                <Item label="Perfil" value={record.professional.primaryProfile || "—"} />
                <Item label="Especialidad" value={record.professional.specialty || "—"} />
                <Item label="Ciudad" value={[record.professional.city, record.professional.department].filter(Boolean).join(" · ") || "—"} />
                <Item label="Experiencia neta" value={`${record.professional.generalExperienceMonths} meses`} />
              </dl>
              {canEdit && (
                <ItcButton
                  className="text-xs"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => {
                    const profession = window.prompt("Profesión", record.professional.profession);
                    if (profession == null) return;
                    startTransition(async () => {
                      await savePerfilAction(
                        {
                          givenName: record.professional.givenName,
                          middleName: record.professional.middleName,
                          familyName: record.professional.familyName,
                          profession,
                          primaryProfile: record.professional.primaryProfile,
                          specialty: record.professional.specialty,
                          city: record.professional.city,
                          department: record.professional.department,
                          notes: record.professional.notes,
                        },
                        record.professional.id,
                      );
                      toast.success("Perfil actualizado");
                      reload();
                    });
                  }}
                >
                  Editar profesión
                </ItcButton>
              )}
            </section>

            <EducationEditor
              items={record.education}
              canEdit={canEdit}
              onSave={async (items) => {
                await saveEducationAction(record.professional.id, items);
                reload();
              }}
            />
            <ExperienceEditor
              items={record.experiences}
              canEdit={canEdit}
              onSave={async (items) => {
                await saveExperiencesAction(record.professional.id, items);
                reload();
              }}
            />
            <CertificationEditor
              items={record.certifications}
              canEdit={canEdit}
              onSave={async (items) => {
                await saveCertificationsAction(record.professional.id, items);
                reload();
              }}
            />
            <LicenseEditor
              items={record.licenses}
              canEdit={canEdit}
              onSave={async (items) => {
                await saveLicensesAction(record.professional.id, items);
                reload();
              }}
            />
            <SkillEditor
              items={record.skills}
              canEdit={canEdit}
              onSave={async (items) => {
                await saveSkillsAction(record.professional.id, items);
                reload();
              }}
            />

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Soportes documentales</h3>
              {record.attachments.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                  <span>
                    {item.name} · {item.kind} · {item.status}
                  </span>
                  {item.storagePath && (
                    <a className="text-primary text-xs" href={`/api/perfiles/soportes/${record.professional.id}/${item.id}`}>
                      Descargar
                    </a>
                  )}
                </div>
              ))}
              {canEdit && (
                <input
                  type="file"
                  className="block w-full text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.set("professionalId", record.professional.id);
                    fd.set("file", file);
                    fd.set("kind", "otro");
                    startTransition(async () => {
                      try {
                        await uploadAttachmentAction(fd);
                        toast.success("Soporte cargado");
                        reload();
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "No se pudo cargar");
                      }
                    });
                  }}
                />
              )}
            </section>

            <ConsentBlock
              consent={record.consent}
              canEdit={canEdit}
              onSave={async (input) => {
                await saveConsentAction(record.professional.id, input);
                toast.success("Autorización registrada");
                reload();
              }}
            />

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Hojas de vida generadas</h3>
                {canEdit && <ItcButton className="text-xs" onClick={onGenerate}>Nueva HV</ItcButton>}
              </div>
              {record.generatedResumes.map((item) => (
                <div key={item.id} className="crystal-surface space-y-1 rounded-2xl p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {item.proposedRoleName} · v{item.version}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.tenderLabel ?? "Sin proceso"} · {formatDate(item.createdAt)} · {item.status}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <ItcButton href={`/api/perfiles/resumes/${record.professional.id}/${item.id}`} className="text-xs">
                        Descargar
                      </ItcButton>
                      {canEdit && (
                        <ItcButton
                          className="text-xs"
                          variant="secondary"
                          onClick={() => {
                            startTransition(async () => {
                              await regenerateResumeAction(record.professional.id, item.id);
                              toast.success("Se generó una versión nueva");
                              reload();
                            });
                          }}
                        >
                          Regenerar
                        </ItcButton>
                      )}
                      {canApprove && item.status !== "aprobado" && (
                        <ItcButton
                          className="text-xs"
                          onClick={() => {
                            startTransition(async () => {
                              await approveResumeAction(record.professional.id, item.id);
                              toast.success("Hoja de vida aprobada");
                              reload();
                            });
                          }}
                        >
                          Aprobar
                        </ItcButton>
                      )}
                    </div>
                  </div>
                  {item.warnings.length > 0 && (
                    <p className="text-xs text-amber-700">{item.warnings.join(" · ")}</p>
                  )}
                </div>
              ))}
              {!record.generatedResumes.length && <p className="text-sm text-muted-foreground">Aún no hay versiones generadas.</p>}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground uppercase">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ConsentBlock({
  consent,
  canEdit,
  onSave,
}: {
  consent: ProfessionalConsent | null;
  canEdit: boolean;
  onSave: (input: Partial<ProfessionalConsent>) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const current = consent ?? {
    id: "",
    store: false,
    consult: false,
    present: false,
    shareWithEntity: false,
    legalBasis: "Ley 1581 de 2012",
    grantedOn: null,
    evidenceRef: null,
  };
  return (
    <section className="crystal-surface space-y-3 rounded-2xl p-4">
      <h3 className="text-sm font-semibold">Autorización de tratamiento de datos (Ley 1581 de 2012)</h3>
      <p className="text-xs text-muted-foreground">
        Sin autorización de presentación no se genera ni se comparte la hoja de vida.
      </p>
      <Toggle label="Almacenar" checked={current.store} disabled={!canEdit || isPending} onChange={(store) => startTransition(() => onSave({ ...current, store }))} />
      <Toggle label="Consultar internamente" checked={current.consult} disabled={!canEdit || isPending} onChange={(consult) => startTransition(() => onSave({ ...current, consult }))} />
      <Toggle label="Presentar en propuestas" checked={current.present} disabled={!canEdit || isPending} onChange={(present) => startTransition(() => onSave({ ...current, present }))} />
      <Toggle label="Compartir con la entidad contratante" checked={current.shareWithEntity} disabled={!canEdit || isPending} onChange={(shareWithEntity) => startTransition(() => onSave({ ...current, shareWithEntity }))} />
    </section>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </label>
  );
}
