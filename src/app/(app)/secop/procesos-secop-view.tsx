"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, RefreshCw, Search } from "lucide-react";
import { ItcTable, type TableColumn, ItcButton, ItcInput } from "@/components/itc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP, formatDate, formatDateTime } from "@/lib/format";
// Desde @/lib/secop-shared, no @/lib/secop: ese último es server-only (importa
// next/headers vía apiFetch) y romperia el bundle de este componente cliente.
import {
  datasetLabels,
  type Paginado,
  type ProcesoRow,
  type SincronizacionRow,
} from "@/lib/secop-shared";
import { sincronizarSecop } from "./actions";

const TODOS = "todos";

const estadoTone: Record<string, Tone> = {
  ok: "success",
  error: "danger",
  running: "info",
};

const estadoLabel: Record<string, string> = {
  ok: "Completada",
  error: "Con error",
  running: "En curso",
};

export function ProcesosSecopView({
  procesos,
  sincronizaciones,
  filtros,
  esAdmin,
}: {
  procesos: Paginado<ProcesoRow>;
  sincronizaciones: SincronizacionRow[];
  filtros: { dataset: string; soloNuevos: boolean; buscar: string };
  esAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, startSync] = useTransition();
  const [buscar, setBuscar] = useState(filtros.buscar);

  // Los filtros viven en la URL, no en estado local: así la vista es
  // compartible, sobrevive un refresh y el listado se sigue resolviendo en el
  // servidor (la paginación es del backend, no del cliente).
  const aplicar = (cambios: Partial<{ dataset: string; nuevos: boolean; buscar: string; page: number }>) => {
    const next = {
      dataset: cambios.dataset ?? filtros.dataset,
      nuevos: cambios.nuevos ?? filtros.soloNuevos,
      buscar: cambios.buscar ?? buscar,
      // Cualquier cambio de filtro vuelve a la página 1; si no, se puede quedar
      // en una página que ya no existe con el filtro nuevo.
      page: cambios.page ?? 1,
    };

    const qs = new URLSearchParams();
    if (next.dataset) qs.set("dataset", next.dataset);
    if (next.nuevos) qs.set("nuevos", "1");
    if (next.buscar.trim()) qs.set("buscar", next.buscar.trim());
    if (next.page > 1) qs.set("page", String(next.page));

    startTransition(() => {
      router.push(qs.size > 0 ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleSincronizar = () => {
    startSync(async () => {
      try {
        await sincronizarSecop();
        toast.success("Sincronización encolada", {
          description: "Los resultados aparecerán en unos minutos. Actualiza la página para verlos.",
        });
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo encolar la sincronización");
      }
    });
  };

  const columns: TableColumn<ProcesoRow>[] = [
    {
      key: "titulo",
      title: "Proceso",
      render: (r) => (
        <div className="min-w-0 max-w-md">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{r.titulo ?? r.secopId}</span>
            {r.esNuevo && <StatusBadge tone="info">Nuevo</StatusBadge>}
          </div>
          <p className="truncate text-xs text-muted-foreground">{r.entidad ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "dataset",
      title: "Fuente",
      render: (r) => (
        <StatusBadge tone="muted">{datasetLabels[r.dataset] ?? r.dataset}</StatusBadge>
      ),
    },
    {
      key: "modalidad",
      title: "Modalidad",
      render: (r) => <span className="text-sm text-muted-foreground">{r.modalidad ?? "—"}</span>,
    },
    {
      key: "estado",
      title: "Estado",
      render: (r) => <span className="text-sm text-muted-foreground">{r.estado ?? "—"}</span>,
    },
    {
      key: "valor",
      title: "Valor",
      align: "right",
      render: (r) => <span className="text-sm tabular-nums">{formatCOP(r.valor)}</span>,
    },
    {
      key: "fechaPublicacion",
      title: "Publicación",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.fechaPublicacion)}</span>
      ),
    },
    {
      key: "acciones",
      title: "",
      align: "right",
      render: (r) =>
        r.url ? (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded p-1.5 hover:bg-muted"
            title="Abrir en SECOP"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null,
    },
  ];

  const totalPaginas = Math.max(Math.ceil(procesos.total / procesos.pageSize), 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Filtros</CardTitle>
          {esAdmin && (
            <ItcButton onClick={handleSincronizar} disabled={isSyncing}>
              {isSyncing ? <Spinner className="size-3.5" /> : <RefreshCw className="h-4 w-4" />}
              {isSyncing ? "Encolando…" : "Sincronizar ahora"}
            </ItcButton>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label className="mb-1.5">Buscar</Label>
            <div className="flex gap-1.5">
              <ItcInput
                value={buscar}
                placeholder="Título, entidad u objeto…"
                onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setBuscar(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicar({ buscar });
                  }
                }}
              />
              <ItcButton type="button" variant="secondary" onClick={() => aplicar({ buscar })}>
                <Search className="h-4 w-4" />
              </ItcButton>
            </div>
          </div>

          <div>
            <Label className="mb-1.5">Fuente</Label>
            <Select
              value={filtros.dataset || TODOS}
              onValueChange={(value) => aplicar({ dataset: value === TODOS ? "" : value })}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                <SelectItem value="secop_i">SECOP I</SelectItem>
                <SelectItem value="secop_ii">SECOP II</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={filtros.soloNuevos}
                onCheckedChange={(checked) => aplicar({ nuevos: checked })}
              />
              Solo nuevos
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {procesos.total === 0
              ? "Sin resultados"
              : `${procesos.total} proceso${procesos.total === 1 ? "" : "s"} detectado${procesos.total === 1 ? "" : "s"}`}
          </p>
          {isPending && <Spinner className="size-3.5 text-muted-foreground" />}
        </div>

        {procesos.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No hay procesos detectados todavía. Revisa la paramétrica de búsqueda en Administración y
            espera a la próxima sincronización.
          </div>
        ) : (
          <>
            <ItcTable
              data={procesos.items}
              columns={columns}
              rowKey={(r) => r.id}
              striped
              hoverable
              stickyHeader
            />

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between">
                <ItcButton
                  type="button"
                  variant="secondary"
                  disabled={procesos.page <= 1 || isPending}
                  onClick={() => aplicar({ page: procesos.page - 1 })}
                >
                  Anterior
                </ItcButton>
                <span className="text-sm text-muted-foreground">
                  Página {procesos.page} de {totalPaginas}
                </span>
                <ItcButton
                  type="button"
                  variant="secondary"
                  disabled={procesos.page >= totalPaginas || isPending}
                  onClick={() => aplicar({ page: procesos.page + 1 })}
                >
                  Siguiente
                </ItcButton>
              </div>
            )}
          </>
        )}
      </div>

      {esAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas sincronizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {sincronizaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no se ha ejecutado ninguna sincronización.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {sincronizaciones.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <StatusBadge tone={estadoTone[s.estado] ?? "muted"}>
                      {estadoLabel[s.estado] ?? s.estado}
                    </StatusBadge>
                    <span className="font-medium">{datasetLabels[s.dataset] ?? s.dataset}</span>
                    <span className="text-muted-foreground">{formatDateTime(s.inicio)}</span>
                    {s.estado === "ok" && (
                      <span className="text-muted-foreground">
                        {s.consultados} consultados · {s.insertados} nuevos · {s.actualizados}{" "}
                        actualizados
                      </span>
                    )}
                    {s.errorMessage && (
                      <span className="text-destructive">
                        {s.errorCode}: {s.errorMessage}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
