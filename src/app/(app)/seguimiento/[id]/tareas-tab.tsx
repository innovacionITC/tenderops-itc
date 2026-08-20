"use client";

import { useTransition, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ItcButton, ItcInput } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import { TAREA_TITULO_OPCIONES } from "@/lib/seguimiento-shared";
import { SelectConOtro } from "@/app/(app)/secop/select-con-otro";
import { crearTarea } from "./tareas-actions";
import type { TaskRow } from "@/lib/tasks";
import type { UsuarioAsignableRow } from "@/lib/usuarios-asignables";

export function TareasTab({
  procesoId,
  tareas,
  usuariosAsignables,
}: {
  procesoId: string;
  tareas: TaskRow[];
  usuariosAsignables: UsuarioAsignableRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [prioridad, setPrioridad] = useState("media");

  const handleCrear = () => {
    startTransition(async () => {
      try {
        await crearTarea({
          title: titulo,
          description: descripcion || undefined,
          processId: procesoId,
          assignedTo: responsable || undefined,
          priority: prioridad,
          dueAt: fechaLimite || undefined,
        });
        toast.success("Tarea creada");
        setTitulo("");
        setDescripcion("");
        setResponsable("");
        setFechaLimite("");
        setPrioridad("media");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo crear la tarea");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="space-y-3 rounded-xl border p-4">
        <h3 className="text-sm font-semibold">Agregar tarea</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectConOtro
            label="Título"
            value={titulo}
            opciones={TAREA_TITULO_OPCIONES.filter((t) => t !== "Otro")}
            placeholderTodos="Selecciona un título"
            onChange={setTitulo}
          />
          <div>
            <Label className="mb-1.5">Responsable</Label>
            <ItcInput
              type="select"
              value={responsable}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setResponsable(e.target.value)
              }
            >
              <option value="">Sin asignar</option>
              {usuariosAsignables.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </ItcInput>
          </div>
          <div>
            <Label className="mb-1.5">Fecha límite</Label>
            <ItcInput
              type="date"
              value={fechaLimite}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setFechaLimite(e.target.value)
              }
            />
          </div>
          <div>
            <Label className="mb-1.5">Prioridad</Label>
            <ItcInput
              type="select"
              value={prioridad}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setPrioridad(e.target.value)
              }
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
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
        <ItcButton onClick={handleCrear} disabled={!titulo || isPending}>
          {isPending && <Spinner className="size-3.5" />}
          Agregar tarea
        </ItcButton>
      </div>

      {/* Listado */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tareas</h3>
        <StatusBadge tone="muted">{tareas.length}</StatusBadge>
      </div>
      {tareas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin tareas registradas.</p>
      ) : (
        <ul className="space-y-2">
          {tareas.map((t) => (
            <li key={t.id} className="rounded-xl border p-3 hover:bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  {t.description && (
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.description}
                    </div>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>{t.assignedToName ?? "Sin asignar"}</span>
                    {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <StatusBadge
                    tone={
                      t.priority === "alta"
                        ? "danger"
                        : t.priority === "media"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {t.priority ?? "—"}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      t.status === "completada"
                        ? "success"
                        : t.status === "vencida"
                          ? "danger"
                          : "info"
                    }
                  >
                    {t.status ?? "—"}
                  </StatusBadge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
