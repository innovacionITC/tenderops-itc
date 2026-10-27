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
import type { CatalogItem, CiudadRow } from "@/lib/parametrica";
import { createCiudad, deleteCiudad, setCiudadEstado, updateCiudad } from "./actions";
import { ciudadSchema } from "./schema";

type DialogState = { mode: "create" } | { mode: "edit"; row: CiudadRow } | null;

export function CiudadesTable({
  rows,
  departamentos,
}: {
  rows: CiudadRow[];
  departamentos: CatalogItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CiudadRow | null>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();

  const [nombre, setNombre] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");

  const openCreate = () => {
    setNombre("");
    setDepartamentoId("");
    setFieldErrors({});
    setDialog({ mode: "create" });
  };

  const openEdit = (row: CiudadRow) => {
    setNombre(row.nombre);
    setDepartamentoId(row.departamentoId ?? "");
    setFieldErrors({});
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    const result = ciudadSchema.safeParse({ nombre, departamentoId });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createCiudad(result.data);
        } else if (dialog?.mode === "edit") {
          await updateCiudad(dialog.row.id, result.data);
        }
        toast.success("Ciudad guardada");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la ciudad");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteCiudad(deleteTarget.id);
        toast.success("Ciudad eliminada");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la ciudad");
      }
    });
  };

  const handleEstadoChange = (row: CiudadRow, estado: boolean) => {
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await setCiudadEstado(row.id, estado);
        toast.success(estado ? "Ciudad activada" : "Ciudad desactivada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<CiudadRow>[] = [
    {
      key: "nombre",
      title: "Ciudad",
      render: (r) => <span className="font-medium">{r.nombre}</span>,
    },
    {
      key: "departamentoNombre",
      title: "Departamento",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.departamentoNombre ?? "—"}</span>
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
          <Plus className="h-4 w-4" /> Nueva ciudad
        </ItcButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin ciudades registradas. Puedes cargarlas con{" "}
          <code className="font-mono text-xs">node scripts/seed-ubicaciones.mjs</code>.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["nombre", "departamentoNombre"]}
          searchPlaceholder="Buscar ciudad o departamento…"
          // ~1.100 municipios: la paginación del componente evita renderizar
          // todas las filas a la vez.
          pagination
          pageSize={20}
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nueva ciudad" : "Editar ciudad"}
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
            <div>
              <Label className="mb-1.5" htmlFor="ciudad-departamento">
                Departamento <span className="text-destructive">*</span>
              </Label>
              {/* select nativo: ItcModal abre un <dialog> en el top layer y los
                  dropdowns portalados (Radix Select) quedarían detrás de él. */}
              <select
                id="ciudad-departamento"
                value={departamentoId}
                onChange={(e) => { setDepartamentoId(e.target.value); clearFieldError("departamentoId"); }}
                aria-invalid={!!fieldErrors.departamentoId}
                className="crystal-field h-9 w-full min-w-0 px-3 py-1 text-sm outline-none aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  Selecciona un departamento
                </option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              {fieldErrors.departamentoId && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.departamentoId}</p>
              )}
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
        title="¿Eliminar ciudad?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-medium">{deleteTarget?.nombre}</span>
            {deleteTarget?.departamentoNombre ? ` (${deleteTarget.departamentoNombre})` : ""}. Si
            estaba seleccionada en Paramétrica, también se quitará de ahí.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
