"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput, ItcModal } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { useFieldErrors, zodIssuesToFieldErrors } from "@/lib/form-errors";
import type { PlantillaRow } from "@/lib/plantillas";
import type { AppRole } from "@/lib/auth/roles";
import { canAdmin } from "@/lib/auth/roles";
import { createPlantilla, deletePlantilla, updatePlantilla } from "./actions";
import { plantillaSchema, createArchivoSchema, archivoSchema, ALLOWED_EXTENSIONS } from "./schema";

type DialogState = { mode: "create" } | { mode: "edit"; row: PlantillaRow } | null;

export function PlantillasTable({
  rows,
  userRole,
}: {
  rows: PlantillaRow[];
  userRole: AppRole | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlantillaRow | null>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const canCreate = canAdmin(userRole);

  const openCreate = () => {
    setNombre("");
    setDescripcion("");
    setFieldErrors({});
    if (fileRef.current) fileRef.current.value = "";
    setDialog({ mode: "create" });
  };

  const openEdit = (row: PlantillaRow) => {
    setNombre(row.nombre);
    setDescripcion(row.descripcion ?? "");
    setFieldErrors({});
    if (fileRef.current) fileRef.current.value = "";
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    const result = plantillaSchema.safeParse({ nombre, descripcion });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }

    const file = fileRef.current?.files?.[0];
    const isCreating = dialog?.mode === "create";

    if (isCreating && (!file || file.size === 0)) {
      setFieldErrors((prev) => ({ ...prev, file: "El archivo es obligatorio" }));
      return;
    }

    if (file && file.size > 0) {
      const schema = isCreating ? createArchivoSchema : archivoSchema;
      const fileResult = schema.safeParse(file);
      if (!fileResult.success) {
        setFieldErrors((prev) => ({
          ...prev,
          file: fileResult.error.issues[0]?.message ?? "Archivo inválido",
        }));
        return;
      }
    }

    setFieldErrors({});
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("nombre", result.data.nombre);
        fd.append("descripcion", result.data.descripcion);
        if (file && file.size > 0) fd.append("file", file);

        if (dialog?.mode === "create") {
          await createPlantilla(fd);
        } else if (dialog?.mode === "edit") {
          await updatePlantilla(dialog.row.id, fd);
        }
        toast.success("Plantilla guardada");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la plantilla");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deletePlantilla(deleteTarget.id);
        toast.success("Plantilla eliminada");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la plantilla");
      }
    });
  };

  const columns: TableColumn<PlantillaRow>[] = [
    {
      key: "nombre",
      title: "Nombre",
      render: (r) => <span className="font-medium">{r.nombre}</span>,
    },
    {
      key: "descripcion",
      title: "Descripción",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.descripcion ?? "—"}</span>
      ),
    },
    {
      key: "archivo",
      title: "Archivo",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.archivo ?? "—"}</span>
      ),
    },
    {
      key: "acciones",
      title: "Acciones",
      align: "right",
      render: (r) =>
        canCreate ? (
          <div className="flex justify-end gap-1">
            <ItcButton onClick={() => openEdit(r)} className="p-1.5 hover:bg-muted rounded">
              <Pencil className="h-3.5 w-3.5" />
            </ItcButton>
            <ItcButton onClick={() => setDeleteTarget(r)} className="p-1.5 hover:bg-muted rounded">
              <Trash2 className="h-3.5 w-3.5" />
            </ItcButton>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <ItcButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nueva plantilla
          </ItcButton>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin plantillas registradas.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["nombre", "descripcion"]}
          searchPlaceholder="Buscar plantilla…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nueva plantilla" : "Editar plantilla"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Nombre <span className="text-destructive">*</span></Label>
              <ItcInput
                value={nombre}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setNombre(e.target.value); clearFieldError("nombre"); }}
                placeholder="Nombre de la plantilla"
                aria-invalid={!!fieldErrors.nombre}
              />
              {fieldErrors.nombre && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.nombre}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Descripción <span className="text-destructive">*</span></Label>
              <ItcInput
                value={descripcion}
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setDescripcion(e.target.value); clearFieldError("descripcion"); }}
                placeholder="Descripción de la plantilla"
                aria-invalid={!!fieldErrors.descripcion}
              />
              {fieldErrors.descripcion && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.descripcion}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Archivo{dialog?.mode === "create" ? <> <span className="text-destructive">*</span></> : null}</Label>
              <input
                ref={fileRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={() => clearFieldError("file")}
                className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {dialog?.mode === "edit" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Dejar vacío para conservar el archivo actual{dialog.row.archivo ? ` (${dialog.row.archivo})` : ""}.
                </p>
              )}
              {fieldErrors.file && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.file}</p>
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
        title="¿Eliminar plantilla?"
        content={
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-medium">{deleteTarget?.nombre}</span>. Esta acción no
            se puede deshacer.
          </p>
        }
        variant="confirm"
        disabled={isPending}
      />
    </div>
  );
}
