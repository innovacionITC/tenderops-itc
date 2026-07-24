"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ItcTable, type TableColumn } from "@/components/itc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/layout/status-badge";
import { formatDateTime } from "@/lib/format";
import { roleLabels } from "@/lib/format";
import type { AppRole } from "@/lib/auth/roles";
import type { UserRow } from "@/lib/users";
import { setUserStatus, updateUserRole } from "./actions";

const ROLE_OPTIONS = Object.keys(roleLabels) as AppRole[];

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

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
                {ROLE_OPTIONS.map((role) => (
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
              onCheckedChange={(checked) => handleStatusChange(u.id, checked)}
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

  return users.length === 0 ? (
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
      striped
      hoverable
      stickyHeader
    />
  );
}
