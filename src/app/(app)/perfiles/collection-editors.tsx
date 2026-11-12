"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { newId } from "@/lib/perfiles/ids";
import type {
  ProfessionalCertification,
  ProfessionalEducation,
  ProfessionalExperience,
  ProfessionalLicense,
  ProfessionalSkill,
} from "@/lib/perfiles/contracts";
import { EDUCATION_LEVEL_LABELS } from "@/lib/perfiles/contracts";

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1 text-xs">{label}</Label>
      <ItcInput value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function usePersistedRows<T>(
  items: T[],
  onSave: (items: T[]) => Promise<unknown>,
  success: string,
) {
  const [rows, setRows] = useState(items);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = (next: T[], immediate = false) => {
    setRows(next);
    const run = () => {
      startTransition(async () => {
        try {
          await onSave(next);
          toast.success(success);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "No se pudo guardar");
        }
      });
    };
    if (timer.current) clearTimeout(timer.current);
    if (immediate) run();
    else timer.current = setTimeout(run, 450);
  };

  return { rows, persist, isPending };
}

export function EducationEditor({
  items,
  canEdit,
  onSave,
}: {
  items: ProfessionalEducation[];
  canEdit: boolean;
  onSave: (items: ProfessionalEducation[]) => Promise<unknown>;
}) {
  const { rows, persist, isPending } = usePersistedRows(items, onSave, "Formación guardada");

  return (
    <Section
      title="Formación académica"
      canEdit={canEdit}
      pending={isPending}
      onAdd={() =>
        persist(
          [
            ...rows,
            {
              id: newId(),
              externalId: "",
              level: "profesional",
              title: "",
              institution: "",
              country: "CO",
              startedOn: null,
              graduatedOn: null,
              status: "graduado",
              supportRef: null,
              verification: "pendiente",
            },
          ],
          true,
        )
      }
    >
      {rows.map((item, index) => (
        <div key={item.id} className="crystal-surface grid gap-2 rounded-2xl p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Título" value={item.title} onChange={(title) => persist(rows.map((row, i) => (i === index ? { ...row, title } : row)))} />
            <Field label="Institución" value={item.institution} onChange={(institution) => persist(rows.map((row, i) => (i === index ? { ...row, institution } : row)))} />
            <div>
              <Label className="mb-1 text-xs">Nivel</Label>
              <ItcInput
                type="select"
                value={item.level}
                onChange={(event) =>
                  persist(rows.map((row, i) => (i === index ? { ...row, level: event.target.value as ProfessionalEducation["level"] } : row)))
                }
              >
                {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </ItcInput>
            </div>
            <Field label="Fecha de grado" value={item.graduatedOn ?? ""} onChange={(graduatedOn) => persist(rows.map((row, i) => (i === index ? { ...row, graduatedOn: graduatedOn || null } : row)))} />
          </div>
          {canEdit && (
            <ItcButton className="justify-self-end text-xs" variant="secondary" onClick={() => persist(rows.filter((row) => row.id !== item.id), true)}>
              Eliminar
            </ItcButton>
          )}
        </div>
      ))}
      {!rows.length && <Empty />}
    </Section>
  );
}

export function ExperienceEditor({
  items,
  canEdit,
  onSave,
}: {
  items: ProfessionalExperience[];
  canEdit: boolean;
  onSave: (items: ProfessionalExperience[]) => Promise<unknown>;
}) {
  const { rows, persist, isPending } = usePersistedRows(items, onSave, "Experiencia guardada");
  return (
    <Section
      title="Experiencia laboral"
      canEdit={canEdit}
      pending={isPending}
      onAdd={() =>
        persist(
          [
            ...rows,
            {
              id: newId(),
              externalId: "",
              client: "",
              employer: "",
              project: "",
              role: "",
              startedOn: "",
              endedOn: null,
              current: false,
              functions: "",
              activities: [],
              technologies: [],
              sector: "",
              projectType: "",
              contractObject: "",
              supportRef: null,
              verification: "pendiente",
              monthsVerified: 0,
            },
          ],
          true,
        )
      }
    >
      {rows.map((item, index) => (
        <div key={item.id} className="crystal-surface grid gap-2 rounded-2xl p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Empresa contratante" value={item.client} onChange={(client) => persist(patch(rows, index, { client, employer: client }))} />
            <Field label="Cargo" value={item.role} onChange={(role) => persist(patch(rows, index, { role }))} />
            <Field label="Proyecto" value={item.project} onChange={(project) => persist(patch(rows, index, { project }))} />
            <Field label="Tecnologías (;)" value={item.technologies.join(";")} onChange={(value) => persist(patch(rows, index, { technologies: splitList(value) }))} />
            <Field label="Fecha inicial" value={item.startedOn} onChange={(startedOn) => persist(patch(rows, index, { startedOn }))} />
            <Field label="Fecha final" value={item.endedOn ?? ""} onChange={(endedOn) => persist(patch(rows, index, { endedOn: endedOn || null, current: !endedOn }))} />
          </div>
          <Field label="Funciones y actividades" value={item.functions} onChange={(functions) => persist(patch(rows, index, { functions }))} />
          {canEdit && (
            <ItcButton className="justify-self-end text-xs" variant="secondary" onClick={() => persist(rows.filter((row) => row.id !== item.id), true)}>
              Eliminar
            </ItcButton>
          )}
        </div>
      ))}
      {!rows.length && <Empty />}
    </Section>
  );
}

export function CertificationEditor({
  items,
  canEdit,
  onSave,
}: {
  items: ProfessionalCertification[];
  canEdit: boolean;
  onSave: (items: ProfessionalCertification[]) => Promise<unknown>;
}) {
  const { rows, persist, isPending } = usePersistedRows(items, onSave, "Certificaciones guardadas");
  return (
    <Section
      title="Certificaciones"
      canEdit={canEdit}
      pending={isPending}
      onAdd={() =>
        persist(
          [
            ...rows,
            {
              id: newId(),
              externalId: "",
              name: "",
              issuer: "",
              credentialCode: "",
              issuedOn: null,
              expiresOn: null,
              verificationUrl: null,
              category: "",
              supportRef: null,
              validity: "sin_fecha",
              verification: "pendiente",
            },
          ],
          true,
        )
      }
    >
      {rows.map((item, index) => (
        <div key={item.id} className="crystal-surface grid gap-2 rounded-2xl p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Nombre" value={item.name} onChange={(name) => persist(patch(rows, index, { name }))} />
            <Field label="Emisor" value={item.issuer} onChange={(issuer) => persist(patch(rows, index, { issuer }))} />
            <Field label="Código" value={item.credentialCode} onChange={(credentialCode) => persist(patch(rows, index, { credentialCode }))} />
            <Field label="Vence" value={item.expiresOn ?? ""} onChange={(expiresOn) => persist(patch(rows, index, { expiresOn: expiresOn || null }))} />
          </div>
          {item.validity === "vencida" && <p className="text-xs text-amber-700">Esta certificación está vencida.</p>}
          {canEdit && (
            <ItcButton className="justify-self-end text-xs" variant="secondary" onClick={() => persist(rows.filter((row) => row.id !== item.id), true)}>
              Eliminar
            </ItcButton>
          )}
        </div>
      ))}
      {!rows.length && <Empty />}
    </Section>
  );
}

export function LicenseEditor({
  items,
  canEdit,
  onSave,
}: {
  items: ProfessionalLicense[];
  canEdit: boolean;
  onSave: (items: ProfessionalLicense[]) => Promise<unknown>;
}) {
  const { rows, persist, isPending } = usePersistedRows(items, onSave, "Acreditaciones guardadas");
  return (
    <Section
      title="Matrículas y acreditaciones"
      canEdit={canEdit}
      pending={isPending}
      onAdd={() =>
        persist(
          [
            ...rows,
            {
              id: newId(),
              externalId: "",
              kind: "matricula",
              issuer: "",
              number: "",
              profession: "",
              issuedOn: null,
              status: "pendiente",
              supportRef: null,
              verification: "pendiente",
            },
          ],
          true,
        )
      }
    >
      {rows.map((item, index) => (
        <div key={item.id} className="crystal-surface grid gap-2 rounded-2xl p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Tipo" value={item.kind} onChange={(kind) => persist(patch(rows, index, { kind: kind as ProfessionalLicense["kind"] }))} />
            <Field label="Entidad" value={item.issuer} onChange={(issuer) => persist(patch(rows, index, { issuer }))} />
            <Field label="Número" value={item.number} onChange={(number) => persist(patch(rows, index, { number }))} />
            <Field label="Profesión" value={item.profession} onChange={(profession) => persist(patch(rows, index, { profession }))} />
          </div>
          {canEdit && (
            <ItcButton className="justify-self-end text-xs" variant="secondary" onClick={() => persist(rows.filter((row) => row.id !== item.id), true)}>
              Eliminar
            </ItcButton>
          )}
        </div>
      ))}
      {!rows.length && <Empty />}
    </Section>
  );
}

export function SkillEditor({
  items,
  canEdit,
  onSave,
}: {
  items: ProfessionalSkill[];
  canEdit: boolean;
  onSave: (items: ProfessionalSkill[]) => Promise<unknown>;
}) {
  const { rows, persist, isPending } = usePersistedRows(items, onSave, "Competencias guardadas");
  return (
    <Section
      title="Competencias y tecnologías"
      canEdit={canEdit}
      pending={isPending}
      onAdd={() => persist([...rows, { id: newId(), name: "", category: "", level: "intermedio" }], true)}
    >
      {rows.map((item, index) => (
        <div key={item.id} className="crystal-surface grid gap-2 rounded-2xl p-3 sm:grid-cols-3">
          <Field label="Competencia" value={item.name} onChange={(name) => persist(patch(rows, index, { name }))} />
          <Field label="Categoría" value={item.category} onChange={(category) => persist(patch(rows, index, { category }))} />
          <Field label="Nivel" value={item.level} onChange={(level) => persist(patch(rows, index, { level: level as ProfessionalSkill["level"] }))} />
        </div>
      ))}
      {!rows.length && <Empty />}
    </Section>
  );
}

function Section({
  title,
  children,
  canEdit,
  pending,
  onAdd,
}: {
  title: string;
  children: React.ReactNode;
  canEdit: boolean;
  pending: boolean;
  onAdd: () => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {canEdit && (
          <ItcButton className="text-xs" variant="secondary" disabled={pending} onClick={onAdd}>
            Añadir
          </ItcButton>
        )}
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Sin registros.</p>;
}

function patch<T>(rows: T[], index: number, values: Partial<T>): T[] {
  return rows.map((row, i) => (i === index ? { ...row, ...values } : row));
}

function splitList(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}
