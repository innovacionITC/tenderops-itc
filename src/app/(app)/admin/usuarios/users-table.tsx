"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { ItcButton, ItcInput, ItcModal, ItcTable, type TableColumn } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/layout/status-badge";
import { RowActionButton } from "@/components/layout/row-action-button";
import { useFieldErrors, zodIssuesToFieldErrors } from "@/lib/form-errors";
import { formatDateTime } from "@/lib/format";
import { roleLabels } from "@/lib/format";
import type { AppRole } from "@/lib/auth/roles";
import type { OrganizacionDisponible, UserRow } from "@/lib/users";
import { CatalogPicker } from "@/app/(app)/admin/parametrica/catalog-picker";
import { createUsuario, setUserStatus, updateUserOrganizaciones, updateUserRole } from "./actions";
import { createUsuarioSchema } from "./schema";

const ROLE_OPTIONS = Object.keys(roleLabels) as AppRole[];

export function UsersTable({
  users,
  currentUserId,
  currentUserRole,
  organizacionesDisponibles,
}: {
  users: UserRow[];
  currentUserId: string;
  currentUserRole: AppRole | null;
  organizacionesDisponibles: OrganizacionDisponible[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(null);
  const [orgDialogUser, setOrgDialogUser] = useState<UserRow | null>(null);
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AppRole>("lectura");
  const [createOrgIds, setCreateOrgIds] = useState<Set<string>>(new Set());
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors();
  // El Select de Radix porta su dropdown a document.body por defecto, pero
  // ItcModal usa <dialog>.showModal(): todo lo de fuera del <dialog> queda
  // inerte y el dropdown no recibe clicks. Apuntamos el container al propio
  // <dialog> vía ref (ver comentario en components/ui/select.tsx).
  const createModalRef = useRef<HTMLDialogElement>(null);

  // Solo un superadmin puede otorgar el rol superadmin a otro usuario (la API
  // lo exige igual con un 403; esto solo evita ofrecer una opción condenada).
  const roleOptions = ROLE_OPTIONS.filter(
    (role) => role !== "superadmin" || currentUserRole === "superadmin",
  );

  const handleRoleChange = (userId: string, role: AppRole) => {
    setPendingId(userId);
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        toast.success("Rol actualizado");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el rol");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleStatusChange = (userId: string, active: boolean) => {
    setPendingId(userId);
    startTransition(async () => {
      try {
        await setUserStatus(userId, active);
        toast.success(active ? "Usuario activado" : "Usuario desactivado");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el estado");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleConfirmDeactivate = () => {
    if (!deactivateTarget) return;
    handleStatusChange(deactivateTarget.id, false);
    setDeactivateTarget(null);
  };

  const openOrganizacionesDialog = (user: UserRow) => {
    const availableIds = new Set(organizacionesDisponibles.map((o) => o.id));
    setSelectedOrgIds(new Set(user.organizaciones.map((o) => o.id).filter((id) => availableIds.has(id))));
    setOrgDialogUser(user);
  };

  const toggleOrgId = (id: string) => {
    setSelectedOrgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCreateOrgId = (id: string) => {
    setCreateOrgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("lectura");
    setCreateOrgIds(new Set());
    setFieldErrors({});
    setCreateOpen(true);
  };

  const handleCreate = () => {
    const result = createUsuarioSchema.safeParse({
      fullName,
      email,
      password: password || undefined,
      confirmPassword: confirmPassword || undefined,
      role,
      organizacionIds: [...createOrgIds],
    });
    if (!result.success) {
      setFieldErrors(zodIssuesToFieldErrors(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      try {
        await createUsuario(result.data);
        toast.success("Usuario creado");
        setCreateOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo crear el usuario");
      }
    });
  };

  const handleSaveOrganizaciones = () => {
    if (!orgDialogUser) return;
    const userId = orgDialogUser.id;
    setPendingId(userId);
    startTransition(async () => {
      try {
        await updateUserOrganizaciones(userId, [...selectedOrgIds]);
        toast.success("Organizaciones actualizadas");
        setOrgDialogUser(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudieron actualizar las organizaciones");
      } finally {
        setPendingId(null);
      }
    });
  };

  const columns: TableColumn<UserRow>[] = [
    {
      key: "usuario",
      title: "Usuario",
      render: (u) => (
        <>
          <div className="font-medium">{u.fullName ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{u.email}</div>
        </>
      ),
    },
    {
      key: "organizaciones",
      title: "Organizaciones",
      render: (u) => (
        <div className="flex flex-wrap items-center gap-1">
          {u.organizaciones.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            u.organizaciones.map((org) => (
              <StatusBadge key={org.id} tone={org.estado ? "info" : "muted"}>
                {org.nombre}
              </StatusBadge>
            ))
          )}
          {organizacionesDisponibles.length > 0 && (
            <RowActionButton
              icon={<Pencil className="h-3.5 w-3.5" />}
              title="Administrar organizaciones"
              onClick={() => openOrganizacionesDialog(u)}
            />
          )}
        </div>
      ),
    },
    {
      key: "rol",
      title: "Rol",
      render: (u) => {
        const isSelf = u.id === currentUserId;
        const rowPending = isPending && pendingId === u.id;
        return (
          <div className="flex items-center gap-2">
            <Select
              value={u.role ?? "lectura"}
              disabled={isSelf || rowPending}
              onValueChange={(value) => handleRoleChange(u.id, value as AppRole)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rowPending && <Spinner className="size-3.5 text-muted-foreground" />}
          </div>
        );
      },
    },
    {
      key: "estado",
      title: "Estado",
      render: (u) => {
        const isSelf = u.id === currentUserId;
        const rowPending = isPending && pendingId === u.id;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={u.status === "activo"}
              disabled={isSelf || rowPending}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleStatusChange(u.id, true);
                } else {
                  setDeactivateTarget(u);
                }
              }}
            />
            <StatusBadge tone={u.status === "activo" ? "success" : "muted"}>
              {u.status === "activo" ? "Activo" : "Inactivo"}
            </StatusBadge>
            {rowPending && <Spinner className="size-3.5 text-muted-foreground" />}
          </div>
        );
      },
    },
    {
      key: "lastLoginAt",
      title: "Último acceso",
      render: (u) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(u.lastLoginAt)}</span>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <ItcButton onClick={openCreate}>
          <Plus className="h-4 w-4" /> Crear usuario
        </ItcButton>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin usuarios registrados.
        </div>
      ) : (
        <ItcTable
          data={users}
          columns={columns}
          rowKey={(u) => u.id}
          showSearch
          searchKeys={["fullName", "email"]}
          searchPlaceholder="Buscar por palabra..."
          pagination
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          striped
          hoverable
          stickyHeader
        />
      )}

      <ItcModal
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="¿Inactivar usuario?"
        content={
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{deactivateTarget?.fullName ?? deactivateTarget?.email}</span>{" "}
            no podrá iniciar sesión hasta que se reactive su cuenta.
          </p>
        }
        variant="confirm"
        confirmText="Inactivar"
        disabled={isPending}
      />

      <ItcModal
        open={orgDialogUser !== null}
        onClose={() => setOrgDialogUser(null)}
        onConfirm={handleSaveOrganizaciones}
        title="Administrar organizaciones"
        content={
          <CatalogPicker
            title={orgDialogUser?.fullName ?? orgDialogUser?.email ?? ""}
            items={organizacionesDisponibles.map((o) => ({ id: o.id, label: o.nombre }))}
            selectedIds={selectedOrgIds}
            onToggle={toggleOrgId}
          />
        }
        variant="form"
        confirmText="Guardar"
        disabled={isPending}
      />

      <ItcModal
        ref={createModalRef}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreate}
        title="Crear usuario"
        // En una sola columna los datos más el selector de organizaciones no
        // cabían en pantalla y obligaban a hacer scroll; en dos columnas sí.
        size="lg"
        content={
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5">Nombre <span className="text-destructive">*</span></Label>
                <ItcInput
                  value={fullName}
                  onChange={(e: any) => { setFullName(e.target.value); clearFieldError("fullName"); }}
                  placeholder="Nombre completo"
                  aria-invalid={!!fieldErrors.fullName}
                />
                {fieldErrors.fullName && <p className="mt-1 text-xs text-destructive">{fieldErrors.fullName}</p>}
              </div>
              <div>
                <Label className="mb-1.5">Correo <span className="text-destructive">*</span></Label>
                <ItcInput
                  value={email}
                  onChange={(e: any) => { setEmail(e.target.value); clearFieldError("email"); }}
                  placeholder="correo@ejemplo.com"
                  type="email"
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
              <div>
                <Label className="mb-1.5">Contraseña</Label>
                <ItcInput
                  value={password}
                  onChange={(e: any) => { setPassword(e.target.value); clearFieldError("password"); }}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.password}
                />
                {fieldErrors.password && <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Déjalo en blanco para que el usuario solo entre con Microsoft</p>
              </div>
              <div>
                <Label className="mb-1.5">Confirmar contraseña</Label>
                <ItcInput
                  value={confirmPassword}
                  onChange={(e: any) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.confirmPassword}
                />
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
              </div>
              <div>
                <Label className="mb-1.5">Rol <span className="text-destructive">*</span></Label>
                <Select value={role} onValueChange={(v) => { setRole(v as AppRole); clearFieldError("role"); }}>
                  <SelectTrigger aria-invalid={!!fieldErrors.role}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent container={createModalRef.current}>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.role && <p className="mt-1 text-xs text-destructive">{fieldErrors.role}</p>}
              </div>
            </div>
            <div>
              <Label className="mb-1.5">Organizaciones <span className="text-destructive">*</span></Label>
              <CatalogPicker
                title=""
                items={organizacionesDisponibles.map((o) => ({ id: o.id, label: o.nombre }))}
                selectedIds={createOrgIds}
                onToggle={toggleCreateOrgId}
              />
              {fieldErrors.organizacionIds && <p className="mt-1 text-xs text-destructive">{fieldErrors.organizacionIds}</p>}
            </div>
          </div>
        }
        variant="form"
        confirmText="Crear"
        disabled={isPending}
      />
    </>
  );
}
