"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput, ItcModal } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    if (!clave.trim()) {
      toast.error("La clave es obligatoria");
      return;
    }
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
          <Plus className="h-4 w-4" /> Nueva credencial
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin credenciales registradas.
        </div>
      ) : (
        <ItcTable data={rows} columns={columns} rowKey={(r) => r.id} striped hoverable stickyHeader />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nueva credencial" : "Editar credencial"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Clave</Label>
              <ItcInput
                value={clave}
                onChange={(e: any) => setClave(e.target.value.toUpperCase())}
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
                  dialog?.mode === "edit" ? "(sin cambios — deja en blanco para no modificar)" : ""
                }
              />
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
        title="¿Eliminar credencial?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-mono">{deleteTarget?.clave}</span>. Las integraciones
            que la usan dejarán de funcionar.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
