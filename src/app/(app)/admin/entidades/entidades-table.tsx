"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput, ItcModal } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { useFieldErrors, zodIssuesToFieldErrors } from "@/lib/form-errors";
import type { EntidadRow } from "@/lib/parametrica";
import { createEntidad, deleteEntidad, setEntidadEstado, updateEntidad } from "./actions";
import { entidadSchema } from "./schema";

type DialogState = { mode: "create" } | { mode: "edit"; row: EntidadRow } | null;

export function EntidadesTable({ rows }: { rows: EntidadRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntidadRow | null>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();

  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [dv, setDv] = useState("");

  const openCreate = () => {
    setNombre("");
    setNit("");
    setDv("");
    setFieldErrors({});
    setDialog({ mode: "create" });
  };

  const openEdit = (row: EntidadRow) => {
    setNombre(row.nombre);
    setNit(row.nit ?? "");
    setDv(row.dv ?? "");
    setFieldErrors({});
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    const result = entidadSchema.safeParse({ nombre, nit, dv });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createEntidad(result.data);
        } else if (dialog?.mode === "edit") {
          await updateEntidad(dialog.row.id, result.data);
        }
        toast.success("Entidad guardada");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la entidad");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteEntidad(deleteTarget.id);
        toast.success("Entidad eliminada");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la entidad");
      }
    });
  };

  const handleEstadoChange = (row: EntidadRow, estado: boolean) => {
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await setEntidadEstado(row.id, estado);
        toast.success(estado ? "Entidad activada" : "Entidad desactivada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<EntidadRow>[] = [
    {
      key: "nombre",
      title: "Entidad",
      render: (r) => <span className="font-medium">{r.nombre}</span>,
    },
    {
      key: "nit",
      title: "NIT",
      render: (r) => (
        <span className="font-mono text-sm">
          {r.nit ? (r.dv ? `${r.nit}-${r.dv}` : r.nit) : "—"}
        </span>
      ),
    },
    {
      key: "estado",
      title: "Estado",
      render: (r) => {
        const rowPending = isPending && pendingId === r.id;
        const activo = r.estado !== false;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={activo}
              disabled={rowPending}
              onCheckedChange={(checked: boolean) => handleEstadoChange(r, checked)}
            />
            <StatusBadge tone={activo ? "success" : "muted"}>
              {activo ? "Activa" : "Inactiva"}
            </StatusBadge>
            {rowPending && <Spinner className="size-3.5 text-muted-foreground" />}
          </div>
        );
      },
    },
    {
      key: "acciones",
      title: "Acciones",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <RowActionButton
            icon={<Pencil className="h-3.5 w-3.5" />}
            title="Editar"
            onClick={() => openEdit(r)}
          />
          <RowActionButton
            icon={<Trash2 className="h-3.5 w-3.5" />}
            title="Eliminar"
            onClick={() => setDeleteTarget(r)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ItcButton onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nueva entidad
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin entidades registradas.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["nombre"]}
          searchPlaceholder="Buscar entidad…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nueva entidad" : "Editar entidad"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Nombre <span className="text-destructive">*</span></Label>
              <ItcInput
                value={nombre}
                onChange={(e: any) => { setNombre(e.target.value); clearFieldError("nombre"); }}
                aria-invalid={!!fieldErrors.nombre}
              />
              {fieldErrors.nombre && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.nombre}</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="mb-1.5">NIT <span className="text-destructive">*</span></Label>
                <ItcInput
                  value={nit}
                  onChange={(e: any) => { setNit(e.target.value); clearFieldError("nit"); }}
                  aria-invalid={!!fieldErrors.nit}
                />
                {fieldErrors.nit && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.nit}</p>
                )}
              </div>
              <div className="w-20">
                <Label className="mb-1.5">DV</Label>
                <ItcInput
                  value={dv}
                  maxLength={1}
                  onChange={(e: any) => { setDv(e.target.value); clearFieldError("dv"); }}
                  aria-invalid={!!fieldErrors.dv}
                />
                {fieldErrors.dv && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.dv}</p>
                )}
              </div>
            </div>
          </div>
        }
        variant="form"
        confirmText={dialog?.mode === "edit" ? "Guardar" : "Crear"}
        disabled={isPending}
      />

      <ItcModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar entidad?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-medium">{deleteTarget?.nombre}</span>. Si estaba
            seleccionada en Paramétrica, también se quitará de ahí.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
