"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/format";
import { TAREA_TITULO_OPCIONES } from "@/lib/seguimiento-shared";
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
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Título
            </label>
            <select
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
            >
              <option value="" disabled>
                Selecciona un título
              </option>
              {TAREA_TITULO_OPCIONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Responsable
            </label>
            <select
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
            >
              <option value="">Sin asignar</option>
              {usuariosAsignables.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Fecha límite
            </label>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              className="h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Descripción (opcional)
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className="w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <button
          onClick={handleCrear}
          disabled={!titulo || isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Agregar tarea
        </button>
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
