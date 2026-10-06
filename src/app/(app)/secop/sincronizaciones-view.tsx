"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ItcButton, ItcTable, type TableColumn } from "@/components/itc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge, type Tone } from "@/components/layout/status-badge";
import { formatDateTime } from "@/lib/format";
import { datasetLabels, type Paginado, type SincronizacionRow } from "@/lib/secop-shared";
import { sincronizarSecop } from "./actions";

const estadoTone: Record<string, Tone> = {
  ok: "success",
  sin_novedades: "muted",
  error: "danger",
  running: "info",
};

const estadoLabel: Record<string, string> = {
  ok: "Completada",
  sin_novedades: "Sin novedades",
  error: "Con error",
  running: "En curso",
};

function formatDuracion(inicio: string, fin: string | null) {
  if (!fin) return "—";
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const segundos = Math.round(ms / 1000);
  if (segundos < 60) return `${segundos} s`;
  return `${Math.floor(segundos / 60)} min ${segundos % 60} s`;
}

export function SincronizacionesView({
  sincronizaciones,
}: {
  sincronizaciones: Paginado<SincronizacionRow>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSyncing, startSync] = useTransition();
  const [isNavegando, startNavegar] = useTransition();

  const totalPaginas = Math.max(
    Math.ceil(sincronizaciones.total / sincronizaciones.pageSize),
    1,
  );

  const irAPagina = (page: number) => {
    startNavegar(() => {
      router.push(`${pathname}?vista=sincronizaciones&page=${page}`);
    });
  };

  const handleSincronizar = () => {
    startSync(async () => {
      try {
        await sincronizarSecop();
        toast.success("Sincronización iniciada", {
          description:
            "Corre en segundo plano y puede tardar unos minutos. Actualiza esta lista para ver el resultado.",
        });
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo encolar la sincronización",
        );
      }
    });
  };

  const columns: TableColumn<SincronizacionRow>[] = [
    {
      key: "estado",
      title: "Estado",
      width: "13%",
      render: (s) => (
        <StatusBadge tone={estadoTone[s.estado] ?? "muted"}>
          {estadoLabel[s.estado] ?? s.estado}
        </StatusBadge>
      ),
    },
    {
      key: "dataset",
      title: "Fuente",
      width: "11%",
      render: (s) => (
        <span className="text-sm font-medium">{datasetLabels[s.dataset] ?? s.dataset}</span>
      ),
    },
    {
      key: "inicio",
      title: "Inicio",
      width: "17%",
      render: (s) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDateTime(s.inicio)}
        </span>
      ),
    },
    {
      key: "duracion",
      title: "Duración",
      width: "10%",
      render: (s) => (
        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
          {formatDuracion(s.inicio, s.fin)}
        </span>
      ),
    },
    {
      key: "consultados",
      title: "Consultados",
      width: "11%",
      align: "right",
      render: (s) => <span className="text-sm tabular-nums">{s.consultados}</span>,
    },
    {
      key: "insertados",
      title: "Nuevos",
      width: "9%",
      align: "right",
      render: (s) => (
        <span
          className={`text-sm tabular-nums ${s.insertados > 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
        >
          {s.insertados}
        </span>
      ),
    },
    {
      key: "actualizados",
      title: "Actualizados",
      width: "11%",
      align: "right",
      render: (s) => <span className="text-sm tabular-nums text-muted-foreground">{s.actualizados}</span>,
    },
    {
      key: "detalle",
      title: "Detalle",
      render: (s) =>
        s.errorMessage ? (
          <span className="block truncate text-sm text-destructive" title={`${s.errorCode ?? ""} ${s.errorMessage}`}>
            {s.errorCode ? `${s.errorCode}: ` : ""}
            {s.errorMessage}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/50">—</span>
        ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Sincronizaciones</CardTitle>
        <ItcButton onClick={handleSincronizar} disabled={isSyncing}>
          {isSyncing ? <Spinner className="size-3.5" /> : <RefreshCw className="h-4 w-4" />}
          {isSyncing ? "Encolando…" : "Sincronizar ahora"}
        </ItcButton>
      </CardHeader>
      <CardContent className="space-y-4">
        {sincronizaciones.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no se ha ejecutado ninguna sincronización.
          </p>
        ) : (
          <>
            <ItcTable
              data={sincronizaciones.items}
              columns={columns}
              rowKey={(s) => s.id}
              pagination={false}
              tableLayout="fixed"
              striped
              hoverable
            />

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between">
                <ItcButton
                  type="button"
                  variant="secondary"
                  disabled={sincronizaciones.page <= 1 || isNavegando}
                  onClick={() => irAPagina(sincronizaciones.page - 1)}
                >
                  Anterior
                </ItcButton>
                <span className="text-sm text-muted-foreground">
                  Página {sincronizaciones.page} de {totalPaginas}
                </span>
                <ItcButton
                  type="button"
                  variant="secondary"
                  disabled={sincronizaciones.page >= totalPaginas || isNavegando}
                  onClick={() => irAPagina(sincronizaciones.page + 1)}
                >
                  Siguiente
                </ItcButton>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
