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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDateTime } from "@/lib/format";
import type { CredentialRow } from "@/lib/credentials";
import { createCredential, deleteCredential, updateCredential } from "./actions";

type DialogState = { mode: "create" } | { mode: "edit"; row: CredentialRow } | null;

export function CredentialsTable({ rows }: { rows: CredentialRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CredentialRow | null>(null);

  const [clave, setClave] = useState("");
  const [valor, setValor] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const openCreate = () => {
    setClave("");
    setValor("");
    setDescripcion("");
    setDialog({ mode: "create" });
  };

  const openEdit = (row: CredentialRow) => {
    setClave(row.clave);
    setValor("");
    setDescripcion(row.descripcion ?? "");
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createCredential({ clave, valor, descripcion });
        } else if (dialog?.mode === "edit") {
          await updateCredential(dialog.row.id, { valor: valor || undefined, descripcion });
        }
        toast.success("Credencial guardada");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la credencial");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteCredential(deleteTarget.id);
        toast.success("Credencial eliminada");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la credencial");
      }
    });
  };

  const columns: TableColumn<CredentialRow>[] = [
    {
      key: "clave",
      title: "Clave",
      render: (r) => <span className="font-mono text-xs">{r.clave}</span>,
    },
    {
      key: "descripcion",
      title: "Descripción",
      render: (r) => <span className="text-sm text-muted-foreground">{r.descripcion ?? "—"}</span>,
    },
    {
      key: "valor",
      title: "Valor",
      render: (r) => (
        <StatusBadge tone={r.hasValue ? "success" : "muted"}>
          {r.hasValue ? "Configurado" : "Vacío"}
        </StatusBadge>
      ),
    },
    {
      key: "fechaModificacion",
      title: "Modificado",
      render: (r) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(r.fechaModificacion)}</span>
      ),
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
          <Plus className="h-4 w-4" /> Nueva credencial
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin credenciales registradas.
        </div>
      ) : (
        <ItcTable data={rows} columns={columns} rowKey={(r) => r.id} striped hoverable stickyHeader />
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "create" ? "Nueva credencial" : "Editar credencial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Clave</Label>
              <Input
                value={clave}
                onChange={(e) => setClave(e.target.value.toUpperCase())}
                disabled={dialog?.mode === "edit"}
                placeholder="POWERBI_EMBED_URL"
              />
            </div>
            <div>
              <Label className="mb-1.5">Valor</Label>
              <Textarea
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={
                  dialog?.mode === "edit"
                    ? "(sin cambios — deja en blanco para no modificar)"
                    : ""
                }
              />
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
            <Button onClick={handleSave} disabled={isPending || !clave}>
              {isPending && <Spinner className="size-3.5" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar credencial?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-mono">{deleteTarget?.clave}</span>. Las
            integraciones que la usan dejarán de funcionar.
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
