"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { DuplicateAction, ImportAnalysis } from "@/lib/perfiles/contracts";
import { analyzeImportAction, commitImportAction } from "./actions";

const STEPS = [
  "Archivo",
  "Estructura",
  "Mapeo",
  "Validación",
  "Revisión",
  "Confirmación",
  "Resultado",
];

export function ImportWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>("actualizar");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setStep(0);
    setFile(null);
    setAnalysis(null);
    setMapping({});
    setDuplicateAction("actualizar");
  };

  const analyze = (nextMapping?: Record<string, string>) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("mapping", JSON.stringify(nextMapping ?? mapping));
    fd.set("duplicateAction", duplicateAction);
    startTransition(async () => {
      try {
        const result = await analyzeImportAction(fd);
        setAnalysis(result);
        setMapping(result.mapping);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo analizar el Excel");
      }
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) reset();
        onOpenChange(value);
      }}
    >
      <SheetContent className="sm:max-w-2xl">
        <SheetTitle>Importar perfiles desde Excel</SheetTitle>
        <SheetDescription>
          Siete hojas: Instrucciones (ignorada), Profesionales, Formación, Experiencias, Certificaciones, Competencias y Acreditaciones.
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

        <div className="mt-4 space-y-3 text-sm">
          {step === 0 && (
            <>
              <p>Descargue la plantilla o suba un .xlsx propio. Los PDF de soportes no van en el archivo.</p>
              <ItcButton href="/api/perfiles/plantilla">Descargar plantilla Excel</ItcButton>
              <div>
                <Label className="mb-1.5">Archivo .xlsx</Label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
                {file ? <p className="mt-1 text-xs text-muted-foreground">{file.name}</p> : null}
              </div>
            </>
          )}
          {step === 1 && (
            <p>
              Se leerán las hojas de datos. La hoja Instrucciones no se convierte en registros. Relacione estudios y
              experiencias con el ID externo del profesional.
            </p>
          )}
          {step === 2 && (
            <div className="grid gap-2">
              <p>Ajuste el mapeo si los encabezados no coinciden con la plantilla.</p>
              {Object.entries(mapping).map(([header, field]) => (
                <div key={header}>
                  <Label className="mb-1 text-xs">{header}</Label>
                  <ItcInput value={field} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value }))} />
                </div>
              ))}
              {!Object.keys(mapping).length && (
                <p className="text-xs text-muted-foreground">El mapeo se sugerirá al analizar el archivo.</p>
              )}
            </div>
          )}
          {step >= 3 && analysis && (
            <>
              <p>
                {analysis.stats.rows} profesionales · {analysis.stats.created} nuevos · {analysis.stats.duplicates}{" "}
                duplicados · {analysis.stats.education} estudios · {analysis.stats.experiences} experiencias ·{" "}
                {analysis.stats.errors} errores
              </p>
              {step === 4 && (
                <div>
                  <Label className="mb-1.5">Duplicados</Label>
                  <ItcInput
                    type="select"
                    value={duplicateAction}
                    onChange={(event) => setDuplicateAction(event.target.value as DuplicateAction)}
                  >
                    <option value="actualizar">Actualizar (sin tocar verificados)</option>
                    <option value="omitir">Omitir existentes</option>
                    <option value="conservar">Conservar ficha actual</option>
                    <option value="revisar">Revisar</option>
                  </ItcInput>
                </div>
              )}
              <ul className="grid max-h-64 gap-2 overflow-auto">
                {analysis.preview.slice(0, 20).map((row) => (
                  <li key={row.externalId} className="rounded-2xl bg-white/70 px-3 py-2">
                    {row.fullName} · {row.action} · {row.experiences} exp. · {row.education} est.
                  </li>
                ))}
              </ul>
              {analysis.issues.slice(0, 8).map((issue) => (
                <p key={issue.id} className="text-xs text-red-700">
                  {issue.sheet} fila {issue.row}: {issue.error}
                </p>
              ))}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <ItcButton
            variant="secondary"
            onClick={() => {
              if (step === 0) onOpenChange(false);
              else setStep((value) => value - 1);
            }}
          >
            {step === 0 ? "Cancelar" : "Atrás"}
          </ItcButton>
          {step < 6 ? (
            <ItcButton
              disabled={isPending || (step === 0 && !file)}
              onClick={() => {
                if (step === 1 && file) analyze();
                if (step === 2 && file) analyze(mapping);
                if (step === 5 && file) {
                  const fd = new FormData();
                  fd.set("file", file);
                  fd.set("mapping", JSON.stringify(mapping));
                  fd.set("duplicateAction", duplicateAction);
                  startTransition(async () => {
                    try {
                      const result = await commitImportAction(fd);
                      setAnalysis(result);
                      toast.success(
                        `Importación confirmada: ${result.stats.created} creados, ${result.stats.updated} actualizados`,
                      );
                      setStep(6);
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "No se pudo importar");
                    }
                  });
                  return;
                }
                setStep((value) => value + 1);
              }}
            >
              {step === 5 ? "Confirmar importación" : "Continuar"}
            </ItcButton>
          ) : (
            <ItcButton
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cerrar
            </ItcButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
