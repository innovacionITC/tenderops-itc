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
import { useFieldErrors, zodIssuesToFieldErrors } from "@/lib/form-errors";
import type { ModalidadRow } from "@/lib/parametrica";
import { createModalidad, deleteModalidad, setModalidadEstado, updateModalidad } from "./actions";
import { modalidadSchema } from "./schema";

type DialogState = { mode: "create" } | { mode: "edit"; row: ModalidadRow } | null;

export function ModalidadesTable({ rows }: { rows: ModalidadRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModalidadRow | null>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();

  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");

  const openCreate = () => {
    setDescripcion("");
    setCodigo("");
    setFieldErrors({});
    setDialog({ mode: "create" });
  };

  const openEdit = (row: ModalidadRow) => {
    setDescripcion(row.descripcion ?? "");
    setCodigo(row.codigo ?? "");
    setFieldErrors({});
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    const result = modalidadSchema.safeParse({ descripcion, codigo });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createModalidad(result.data);
        } else if (dialog?.mode === "edit") {
          await updateModalidad(dialog.row.id, result.data);
        }
        toast.success("Modalidad guardada");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la modalidad");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteModalidad(deleteTarget.id);
        toast.success("Modalidad eliminada");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la modalidad");
      }
    });
  };

  const handleEstadoChange = (row: ModalidadRow, estado: boolean) => {
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await setModalidadEstado(row.id, estado);
        toast.success(estado ? "Modalidad activada" : "Modalidad desactivada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<ModalidadRow>[] = [
    {
      key: "descripcion",
      title: "Modalidad",
      render: (r) => <span className="font-medium">{r.descripcion ?? "—"}</span>,
    },
    {
      key: "codigo",
      title: "Código",
      render: (r) => <span className="font-mono text-xs">{r.codigo ?? "—"}</span>,
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
              onCheckedChange={(checked) => handleEstadoChange(r, checked)}
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
          <ItcButton onClick={() => openEdit(r)} className="p-1.5 hover:bg-muted rounded">
            <Pencil className="h-3.5 w-3.5" />
          </ItcButton>
          <ItcButton onClick={() => setDeleteTarget(r)} className="p-1.5 hover:bg-muted rounded">
            <Trash2 className="h-3.5 w-3.5" />
          </ItcButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ItcButton onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nueva modalidad
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin modalidades registradas.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["descripcion", "codigo"]}
          searchPlaceholder="Buscar por descripción o código…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nueva modalidad" : "Editar modalidad"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Descripción <span className="text-destructive">*</span></Label>
              <ItcInput
                value={descripcion}
                onChange={(e: any) => { setDescripcion(e.target.value); clearFieldError("descripcion"); }}
                aria-invalid={!!fieldErrors.descripcion}
              />
              {fieldErrors.descripcion && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.descripcion}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Código <span className="text-destructive">*</span></Label>
              <ItcInput
                value={codigo}
                onChange={(e: any) => { setCodigo(e.target.value); clearFieldError("codigo"); }}
                aria-invalid={!!fieldErrors.codigo}
              />
              {fieldErrors.codigo && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.codigo}</p>
              )}
            </div>
          </div>
        }
        variant="form"
        disabled={isPending}
      />

      <ItcModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar modalidad?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará{" "}
            <span className="font-medium">{deleteTarget?.descripcion ?? deleteTarget?.codigo}</span>.
            Si estaba seleccionada en Paramétrica, también se quitará de ahí.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
