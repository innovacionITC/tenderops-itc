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
import type { CatalogItem, CiudadRow } from "@/lib/parametrica";
import { createCiudad, deleteCiudad, setCiudadEstado, updateCiudad } from "./actions";

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

  const [nombre, setNombre] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");

  const openCreate = () => {
    setNombre("");
    setDepartamentoId("");
    setDialog({ mode: "create" });
  };

  const openEdit = (row: CiudadRow) => {
    setNombre(row.nombre);
    setDepartamentoId(row.departamentoId ?? "");
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!departamentoId) {
      toast.error("Selecciona un departamento");
      return;
    }
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createCiudad({ nombre, departamentoId });
        } else if (dialog?.mode === "edit") {
          await updateCiudad(dialog.row.id, { nombre, departamentoId });
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
              <Label className="mb-1.5">Nombre</Label>
              <ItcInput value={nombre} onChange={(e: any) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5" htmlFor="ciudad-departamento">
                Departamento
              </Label>
              {/* select nativo: ItcModal abre un <dialog> en el top layer y los
                  dropdowns portalados (Radix Select) quedarían detrás de él. */}
              <select
                id="ciudad-departamento"
                value={departamentoId}
                onChange={(e) => setDepartamentoId(e.target.value)}
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
