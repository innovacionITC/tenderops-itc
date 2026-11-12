"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { savePerfilAction } from "./actions";

export function ProfessionalFormSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    givenName: "",
    middleName: "",
    familyName: "",
    documentType: "CC",
    documentNumber: "",
    profession: "",
    primaryProfile: "",
    specialty: "",
    city: "",
    department: "",
    email: "",
    phone: "",
    notes: "",
  });

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetTitle>Crear profesional</SheetTitle>
        <SheetDescription>
          El número de documento se usa solo para detectar duplicados y nunca se muestra completo.
        </SheetDescription>
        <div className="mt-4 grid gap-3">
          <Field label="Nombres" value={form.givenName} onChange={(v) => set("givenName", v)} required />
          <Field label="Segundo nombre" value={form.middleName} onChange={(v) => set("middleName", v)} />
          <Field label="Apellidos" value={form.familyName} onChange={(v) => set("familyName", v)} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de documento" value={form.documentType} onChange={(v) => set("documentType", v)} />
            <Field label="Número de documento" value={form.documentNumber} onChange={(v) => set("documentNumber", v)} />
          </div>
          <Field label="Profesión" value={form.profession} onChange={(v) => set("profession", v)} />
          <Field label="Perfil principal" value={form.primaryProfile} onChange={(v) => set("primaryProfile", v)} />
          <Field label="Especialidad" value={form.specialty} onChange={(v) => set("specialty", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad" value={form.city} onChange={(v) => set("city", v)} />
            <Field label="Departamento" value={form.department} onChange={(v) => set("department", v)} />
          </div>
          <Field label="Correo" value={form.email} onChange={(v) => set("email", v)} />
          <Field label="Teléfono" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="Notas" value={form.notes} onChange={(v) => set("notes", v)} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <ItcButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </ItcButton>
          <ItcButton
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await savePerfilAction(form);
                  toast.success("Profesional guardado en Supabase");
                  onOpenChange(false);
                  setForm({
                    givenName: "",
                    middleName: "",
                    familyName: "",
                    documentType: "CC",
                    documentNumber: "",
                    profession: "",
                    primaryProfile: "",
                    specialty: "",
                    city: "",
                    department: "",
                    email: "",
                    phone: "",
                    notes: "",
                  });
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo guardar");
                }
              });
            }}
          >
            Guardar
          </ItcButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1.5">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <ItcInput value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
