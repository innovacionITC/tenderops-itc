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
import type { DepartamentoRow } from "@/lib/parametrica";
import {
  createDepartamento,
  deleteDepartamento,
  setDepartamentoEstado,
  updateDepartamento,
} from "./actions";

type DialogState = { mode: "create" } | { mode: "edit"; row: DepartamentoRow } | null;

export function DepartamentosTable({ rows }: { rows: DepartamentoRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartamentoRow | null>(null);

  const [nombre, setNombre] = useState("");

  const openCreate = () => {
    setNombre("");
    setDialog({ mode: "create" });
  };

  const openEdit = (row: DepartamentoRow) => {
    setNombre(row.nombre);
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createDepartamento({ nombre });
        } else if (dialog?.mode === "edit") {
          await updateDepartamento(dialog.row.id, { nombre });
        }
        toast.success("Departamento guardado");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar el departamento");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteDepartamento(deleteTarget.id);
        toast.success("Departamento eliminado");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar el departamento");
      }
    });
  };

  const handleEstadoChange = (row: DepartamentoRow, estado: boolean) => {
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await setDepartamentoEstado(row.id, estado);
        toast.success(estado ? "Departamento activado" : "Departamento desactivado");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<DepartamentoRow>[] = [
    {
      key: "nombre",
      title: "Departamento",
      render: (r) => <span className="font-medium">{r.nombre}</span>,
    },
    {
      key: "ciudadCount",
      title: "Ciudades",
      render: (r) => <span className="text-sm text-muted-foreground">{r.ciudadCount}</span>,
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
          <Plus className="h-4 w-4" /> Nuevo departamento
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin departamentos registrados. Puedes cargarlos con{" "}
          <code className="font-mono text-xs">node scripts/seed-ubicaciones.mjs</code>.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["nombre"]}
          searchPlaceholder="Buscar departamento…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nuevo departamento" : "Editar departamento"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Nombre</Label>
              <ItcInput value={nombre} onChange={(e: any) => setNombre(e.target.value)} />
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
        title="¿Eliminar departamento?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-medium">{deleteTarget?.nombre}</span> junto con sus{" "}
            <span className="font-medium">{deleteTarget?.ciudadCount ?? 0}</span> ciudades. Si
            estaban seleccionados en Paramétrica, también se quitarán de ahí.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
