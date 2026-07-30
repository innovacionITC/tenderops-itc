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
import type { NitRow } from "@/lib/parametrica";
import { createNit, deleteNit, setNitEstado, updateNit } from "./actions";
import { nitSchema } from "./schema";

type DialogState = { mode: "create" } | { mode: "edit"; row: NitRow } | null;

export function NitsTable({ rows }: { rows: NitRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<NitRow | null>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();

  const [nit, setNit] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const openCreate = () => {
    setNit("");
    setDescripcion("");
    setFieldErrors({});
    setDialog({ mode: "create" });
  };

  const openEdit = (row: NitRow) => {
    setNit(row.nit);
    setDescripcion(row.descripcion ?? "");
    setFieldErrors({});
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    const result = nitSchema.safeParse({ nit, descripcion });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createNit(result.data);
        } else if (dialog?.mode === "edit") {
          await updateNit(dialog.row.id, result.data);
        }
        toast.success("NIT guardado");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar el NIT");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteNit(deleteTarget.id);
        toast.success("NIT eliminado");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar el NIT");
      }
    });
  };

  const handleEstadoChange = (row: NitRow, estado: boolean) => {
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await setNitEstado(row.id, estado);
        toast.success(estado ? "NIT activado" : "NIT desactivado");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<NitRow>[] = [
    {
      key: "nit",
      title: "NIT",
      render: (r) => <span className="font-mono text-xs font-medium">{r.nit}</span>,
    },
    {
      key: "descripcion",
      title: "Descripción",
      render: (r) => <span>{r.descripcion ?? "—"}</span>,
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
              {activo ? "Activo" : "Inactivo"}
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
          <Plus className="h-4 w-4" /> Nuevo NIT
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin NITs registrados.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["nit", "descripcion"]}
          searchPlaceholder="Buscar por NIT o descripción…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nuevo NIT" : "Editar NIT"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">NIT <span className="text-destructive">*</span></Label>
              <ItcInput
                value={nit}
                onChange={(e: any) => { setNit(e.target.value); clearFieldError("nit"); }}
                aria-invalid={!!fieldErrors.nit}
              />
              {fieldErrors.nit && <p className="mt-1 text-xs text-destructive">{fieldErrors.nit}</p>}
            </div>
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
          </div>
        }
        variant="form"
        disabled={isPending}
      />

      <ItcModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar NIT?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-medium">{deleteTarget?.nit}</span>. Si estaba
            seleccionado en Paramétrica, también se quitará de ahí.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
