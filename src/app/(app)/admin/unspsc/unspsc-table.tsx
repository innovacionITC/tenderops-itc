"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput, ItcModal } from "@/components/itc";
import { Label } from "@/components/ui/label";
import type { UnspscRow } from "@/lib/unspsc";
import { createUnspscCode, deleteUnspscCode, updateUnspscCode } from "./actions";

type DialogState = { mode: "create" } | { mode: "edit"; row: UnspscRow } | null;

export function UnspscTable({ rows }: { rows: UnspscRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnspscRow | null>(null);

  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const openCreate = () => {
    setCodigo("");
    setDescripcion("");
    setDialog({ mode: "create" });
  };

  const openEdit = (row: UnspscRow) => {
    setCodigo(row.codigo);
    setDescripcion(row.descripcion ?? "");
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    if (!codigo.trim()) {
      toast.error("El código es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createUnspscCode({ codigo, descripcion });
        } else if (dialog?.mode === "edit") {
          await updateUnspscCode(dialog.row.id, { codigo, descripcion });
        }
        toast.success("Código guardado");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar el código");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteUnspscCode(deleteTarget.id);
        toast.success("Código eliminado");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar el código");
      }
    });
  };

  const columns: TableColumn<UnspscRow>[] = [
    {
      key: "codigo",
      title: "Código",
      render: (r) => <span className="font-mono text-xs">{r.codigo}</span>,
    },
    {
      key: "descripcion",
      title: "Descripción",
      render: (r) => <span className="text-sm text-muted-foreground">{r.descripcion ?? "—"}</span>,
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
          <Plus className="h-4 w-4" /> Nuevo código
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin códigos registrados.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["codigo", "descripcion"]}
          searchPlaceholder="Buscar por código o descripción…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nuevo código" : "Editar código"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Código</Label>
              <ItcInput value={codigo} onChange={(e: any) => setCodigo(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5">Descripción</Label>
              <ItcInput value={descripcion} onChange={(e: any) => setDescripcion(e.target.value)} />
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
        title="¿Eliminar código?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-mono">{deleteTarget?.codigo}</span>. Si estaba
            seleccionado en Paramétrica, también se quitará de ahí.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
