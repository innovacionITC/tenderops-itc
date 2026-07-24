"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ItcTable, type TableColumn } from "@/components/itc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo código
        </Button>
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

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "create" ? "Nuevo código" : "Editar código"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5">Descripción</Label>
              <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending || !codigo.trim()}>
              {isPending && <Spinner className="size-3.5" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar código?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-mono">{deleteTarget?.codigo}</span>. Si estaba
            seleccionado en Paramétrica, también se quitará de ahí.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Spinner className="size-3.5" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
