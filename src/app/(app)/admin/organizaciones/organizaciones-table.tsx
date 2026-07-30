"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput, ItcModal } from "@/components/itc";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/layout/status-badge";
import { useFieldErrors, zodIssuesToFieldErrors } from "@/lib/form-errors";
import type { OrganizacionRow } from "@/lib/organizaciones";
import type { CatalogItem } from "@/lib/parametrica";
import type { AppRole } from "@/lib/auth/roles";
import { nitSchema } from "../nits/schema";
import {
  createNitQuick,
  createOrganizacion,
  deleteOrganizacion,
  setOrganizacionEstado,
  updateOrganizacion,
} from "./actions";
import { createSchema } from "./schema";

type DialogState = { mode: "create" } | { mode: "edit"; row: OrganizacionRow } | null;

export function OrganizacionesTable({
  rows,
  nits,
  userRole,
}: {
  rows: OrganizacionRow[];
  nits: CatalogItem[];
  userRole: AppRole | null;
}) {
  const router = useRouter();
  // Callback ref (no useRef): SelectContent necesita el nodo <dialog> como
  // container para el Portal, y leer formModalRef.current durante el render
  // viola las reglas de hooks — con estado, el nodo llega en un re-render
  // normal apenas ItcModal lo monta.
  const [formModalNode, setFormModalNode] = useState<HTMLDialogElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganizacionRow | null>(null);
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();
  const { fieldErrors: newNitErrors, setFieldErrors: setNewNitErrors, clearFieldError: clearNewNitError } =
    useFieldErrors();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nitId, setNitId] = useState<string | undefined>(undefined);
  const [nitList, setNitList] = useState<CatalogItem[]>([]);
  const [newNit, setNewNit] = useState("");
  const [newNitDesc, setNewNitDesc] = useState("");
  const [showNewNit, setShowNewNit] = useState(false);
  const [nitPending, setNitPending] = useState(false);

  const canCreate = userRole === "superadmin";

  const availableNits = [
    ...nits,
    ...nitList.filter((created) => !nits.some((n) => n.id === created.id)),
  ];

  const handleCreateNit = () => {
    const result = nitSchema.safeParse({ nit: newNit, descripcion: newNitDesc });
    if (!result.success) {
      setNewNitErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setNewNitErrors({});
    setNitPending(true);
    startTransition(async () => {
      try {
        const created = await createNitQuick(result.data);
        setNitList((prev) => [...prev, { id: created.id, label: created.label, estado: null }]);
        setNitId(created.id);
        setShowNewNit(false);
        setNewNit("");
        setNewNitDesc("");
        toast.success("NIT creado y seleccionado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo crear el NIT");
      } finally {
        setNitPending(false);
      }
    });
  };

  const openCreate = () => {
    setNombre("");
    setEmail("");
    setPhone("");
    setNitId(undefined);
    setShowNewNit(false);
    setNewNit("");
    setNewNitDesc("");
    setFieldErrors({});
    setNewNitErrors({});
    setDialog({ mode: "create" });
  };

  const openEdit = (row: OrganizacionRow) => {
    setNombre(row.nombre);
    setEmail(row.email ?? "");
    setPhone(row.phone ?? "");
    setNitId(row.nitId ?? undefined);
    setShowNewNit(false);
    setNewNit("");
    setNewNitDesc("");
    setFieldErrors({});
    setNewNitErrors({});
    setDialog({ mode: "edit", row });
  };

  const handleSave = () => {
    const result = createSchema.safeParse({ nombre, email, phone, nitId: nitId || "" });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        if (dialog?.mode === "create") {
          await createOrganizacion(result.data);
        } else if (dialog?.mode === "edit") {
          await updateOrganizacion(dialog.row.id, result.data);
        }
        toast.success("Organización guardada");
        setDialog(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la organización");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteOrganizacion(deleteTarget.id);
        toast.success("Organización eliminada");
        setDeleteTarget(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la organización");
      }
    });
  };

  const handleEstadoChange = (row: OrganizacionRow, estado: boolean) => {
    setPendingId(row.id);
    startTransition(async () => {
      try {
        await setOrganizacionEstado(row.id, estado);
        toast.success(estado ? "Organización activada" : "Organización desactivada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<OrganizacionRow>[] = [
    {
      key: "nombre",
      title: "Organización",
      render: (r) => (
        <>
          <div className="font-medium">{r.nombre}</div>
          {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
        </>
      ),
    },
    {
      key: "phone",
      title: "Teléfono",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.phone ?? "—"}</span>
      ),
    },
    {
      key: "nit",
      title: "NIT",
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.nitDescripcion ?? "—"}
        </span>
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
            {canCreate && (
              <Switch
                checked={activo}
                disabled={rowPending}
                onCheckedChange={(checked) => handleEstadoChange(r, checked)}
              />
            )}
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
            <Plus className="h-4 w-4" /> Nueva organización
          </ItcButton>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin organizaciones registradas.
        </div>
      ) : (
        <ItcTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          showSearch
          searchKeys={["nombre", "email"]}
          searchPlaceholder="Buscar organización…"
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        ref={setFormModalNode}
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={handleSave}
        title={dialog?.mode === "create" ? "Nueva organización" : "Editar organización"}
        content={
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Nombre <span className="text-destructive">*</span></Label>
              <ItcInput
                value={nombre}
                onChange={(e: any) => { setNombre(e.target.value); clearFieldError("nombre"); }}
                placeholder="Nombre de la organización"
                aria-invalid={!!fieldErrors.nombre}
              />
              {fieldErrors.nombre && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.nombre}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Correo electrónico <span className="text-destructive">*</span></Label>
              <ItcInput
                type="email"
                value={email}
                onChange={(e: any) => { setEmail(e.target.value); clearFieldError("email"); }}
                placeholder="correo@ejemplo.com"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Teléfono <span className="text-destructive">*</span></Label>
              <ItcInput
                value={phone}
                onChange={(e: any) => { setPhone(e.target.value); clearFieldError("phone"); }}
                placeholder="Teléfono de contacto"
                aria-invalid={!!fieldErrors.phone}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">NIT <span className="text-destructive">*</span></Label>
              {showNewNit ? (
                <div className="space-y-2">
                  <div>
                    <ItcInput
                      value={newNit}
                      onChange={(e: any) => { setNewNit(e.target.value); clearNewNitError("nit"); }}
                      placeholder="NIT (ej. 900123456-1)"
                      aria-invalid={!!newNitErrors.nit}
                    />
                    {newNitErrors.nit && (
                      <p className="mt-1 text-xs text-destructive">{newNitErrors.nit}</p>
                    )}
                  </div>
                  <div>
                    <ItcInput
                      value={newNitDesc}
                      onChange={(e: any) => { setNewNitDesc(e.target.value); clearNewNitError("descripcion"); }}
                      placeholder="Descripción"
                      aria-invalid={!!newNitErrors.descripcion}
                    />
                    {newNitErrors.descripcion && (
                      <p className="mt-1 text-xs text-destructive">{newNitErrors.descripcion}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <ItcButton variant="secondary" size="sm" disabled={nitPending} onClick={handleCreateNit}>
                      {nitPending ? <Spinner className="h-3.5 w-3.5" /> : "Crear"}
                    </ItcButton>
                    <ItcButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowNewNit(false);
                        setNewNit("");
                        setNewNitDesc("");
                        setNewNitErrors({});
                      }}
                    >
                      Cancelar
                    </ItcButton>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <Select
                    value={nitId}
                    onValueChange={(value) => { setNitId(value); clearFieldError("nitId"); }}
                  >
                    <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.nitId}>
                      <SelectValue placeholder="Seleccionar NIT…" />
                    </SelectTrigger>
                    <SelectContent container={formModalNode}>
                      {availableNits.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canCreate && (
                    <ItcButton
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                      onClick={() => { setShowNewNit(true); setNitId(undefined); }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </ItcButton>
                  )}
                </div>
              )}
              {fieldErrors.nitId && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.nitId}</p>
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
        title="¿Eliminar organización?"
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
