"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput, ItcModal } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { useFieldErrors, zodIssuesToFieldErrors } from "@/lib/form-errors";
import type { SuborganizacionRow } from "@/lib/parametrica";
import {
  createSuborganizacion,
  setSuborganizacionEstado,
  updateSuborganizacion,
} from "./actions";
import { suborganizacionSchema } from "./schema";

type DialogState = { mode: "create" } | { mode: "edit"; row: SuborganizacionRow } | null;

export function SuborganizacionesTable({ rows }: { rows: SuborganizacionRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();

  const [nombre, setNombre] = useState("");

  const openCreate = () => {
    setNombre("");
    setFieldErrors({});
    setDialog({ mode: "create" });
  };

  const openEdit = (row: SuborganizacionRow) => {
    setNombre(row.nombre);
    setFieldErrors({});
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    const result = suborganizacionSchema.safeParse({ nombre });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createSuborganizacion(result.data);
        } else if (dialog?.mode === "edit") {
          await updateSuborganizacion(dialog.row.id, result.data);
        }
        toast.success("Suborganización guardada");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la suborganización");
      }
    });
  };

  const handleEstadoChange = (row: SuborganizacionRow, estado: boolean) => {
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await setSuborganizacionEstado(row.id, estado);
        toast.success(estado ? "Suborganización activada" : "Suborganización desactivada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<SuborganizacionRow>[] = [
    {
      key: "nombre",
      title: "Suborganización",
      render: (r) => <span className="font-medium">{r.nombre}</span>,
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ItcButton onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nueva suborganización
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin suborganizaciones registradas.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["nombre"]}
          searchPlaceholder="Buscar suborganización…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nueva suborganización" : "Editar suborganización"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Nombre <span className="text-destructive">*</span></Label>
              <ItcInput
                value={nombre}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setNombre(e.target.value); clearFieldError("nombre"); }}
                aria-invalid={!!fieldErrors.nombre}
              />
              {fieldErrors.nombre && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.nombre}</p>
              )}
            </div>
          </div>
        }
        variant="form"
        confirmText={dialog?.mode === "edit" ? "Guardar" : "Crear"}
        disabled={isPending}
      />
    </div>
  );
}
