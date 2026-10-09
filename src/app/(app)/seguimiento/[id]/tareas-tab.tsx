"use client";

import { useTransition, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import { formatDateTime } from "@/lib/format";
import { TAREA_TITULO_OPCIONES } from "@/lib/seguimiento-shared";
import { SelectConOtro } from "@/app/(app)/secop/select-con-otro";
import { crearCitaCrm } from "./crm-actions";
import type { CitasCrmData } from "./data";

type ChangeEv = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

const OBLIGATORIO = "Campo obligatorio";

// 0 = Baja, 1 = Normal, 2 = Alta: valores estándar de prioritycode en Dynamics.
const prioridadTone = (valor: number | null): Tone =>
  valor === 2 ? "danger" : valor === 1 ? "warning" : "muted";

export function TareasTab({
  procesoId,
  tieneOportunidad,
  citasCrm,
}: {
  procesoId: string;
  tieneOportunidad: boolean;
  citasCrm: CitasCrmData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [intentado, setIntentado] = useState(false);
  const [errorCita, setErrorCita] = useState<string | null>(null);

  const formularioDisponible = tieneOportunidad && !citasCrm.error;
  const faltante = (valor: string) => (intentado && !valor ? OBLIGATORIO : undefined);

  const limpiar = () => {
    setTitulo("");
    setDescripcion("");
    setResponsable("");
    setFechaLimite("");
    setPrioridad("");
    setIntentado(false);
  };

  const handleCrear = () => {
    setIntentado(true);
    if (!titulo || !responsable || !fechaLimite || !prioridad) return;

    startTransition(async () => {
      try {
        await crearCitaCrm(procesoId, {
          titulo,
          descripcion: descripcion || undefined,
          responsableCrmId: responsable,
          fechaLimite,
          prioridad: Number(prioridad),
        });

        setErrorCita(null);
        toast.success("Cita creada en el CRM");
        limpiar();
        router.refresh();
      } catch (e) {
        // Si el CRM falla no se guarda nada: el usuario corrige y reintenta.
        setErrorCita(e instanceof Error ? e.message : "No se pudo crear la cita");
      }
    });
  };

  return (
    <div className="space-y-6">
      {errorCita && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="min-w-0 flex-1 break-words">No se creó la cita. {errorCita}</p>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setErrorCita(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Formulario */}
      <div className="space-y-3 rounded-xl border p-4">
        <h3 className="text-sm font-semibold">Agregar cita</h3>
        {!tieneOportunidad && (
          <p className="text-sm text-muted-foreground">
            Para crear una cita debe existir una oportunidad en el CRM. Créala primero desde la
            pestaña CRM.
          </p>
        )}
        {tieneOportunidad && citasCrm.error && (
          <p className="text-sm text-destructive">
            No se pudo consultar el CRM, por eso el formulario no está disponible: {citasCrm.error}
          </p>
        )}
        <fieldset
          disabled={!formularioDisponible || isPending}
          className="space-y-3 disabled:opacity-60"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <SelectConOtro
                label="Título"
                value={titulo}
                opciones={TAREA_TITULO_OPCIONES.filter((t) => t !== "Otro")}
                placeholderTodos="Selecciona un título"
                onChange={setTitulo}
              />
              {faltante(titulo) && (
                <p className="mt-1 text-xs text-destructive">{OBLIGATORIO}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Responsable</Label>
              <ItcInput
                type="select"
                value={responsable}
                errorMessage={faltante(responsable)}
                onChange={(e: ChangeEv) => setResponsable(e.target.value)}
              >
                <option value="">Selecciona un responsable</option>
                {citasCrm.equipo.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </ItcInput>
            </div>
            <div>
              <Label className="mb-1.5">Fecha límite</Label>
              <ItcInput
                type="date"
                value={fechaLimite}
                errorMessage={faltante(fechaLimite)}
                onChange={(e: ChangeEv) => setFechaLimite(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Prioridad</Label>
              <ItcInput
                type="select"
                value={prioridad}
                errorMessage={faltante(prioridad)}
                onChange={(e: ChangeEv) => setPrioridad(e.target.value)}
              >
                <option value="">Selecciona una prioridad</option>
                {citasCrm.prioridades.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.etiqueta}
                  </option>
                ))}
              </ItcInput>
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Descripción (opcional)</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
            />
          </div>
          <ItcButton onClick={handleCrear} disabled={!formularioDisponible || isPending}>
            {isPending && <Spinner className="size-3.5" />}
            Agregar cita
          </ItcButton>
        </fieldset>
      </div>

      {/* Citas de la oportunidad en el CRM */}
      {tieneOportunidad && !citasCrm.error && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Citas en el CRM</h3>
            <StatusBadge tone="muted">{citasCrm.citas.length}</StatusBadge>
          </div>
          {citasCrm.citas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              La oportunidad no tiene citas registradas.
            </p>
          ) : (
            <ul className="space-y-2">
              {citasCrm.citas.map((c) => (
                <li key={c.id} className="rounded-xl border p-3 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{c.asunto}</div>
                      {c.descripcion && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {c.descripcion}
                        </div>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span>{c.responsable ?? "Sin responsable"}</span>
                        {c.inicio && <span>{formatDateTime(c.inicio)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <StatusBadge tone={prioridadTone(c.prioridad)}>
                        {c.prioridadEtiqueta ?? "—"}
                      </StatusBadge>
                      {c.estado && <StatusBadge tone="info">{c.estado}</StatusBadge>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
