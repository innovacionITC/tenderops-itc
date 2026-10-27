import { BarChart3, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { getDashboard } from "@/lib/dashboard";
import { getPowerBiEmbedUrl } from "@/lib/powerbi";
import { formatCOP, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const [data, powerBiUrl] = await Promise.all([getDashboard(), getPowerBiEmbedUrl()]);
  const presentedValue = data.presented.reduce((sum, process) => {
    const value = Number(process.estimatedValue);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const followRate =
    data.counts.total > 0 ? Math.round((data.counts.followed / data.counts.total) * 100) : null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operación licitatoria de Intelecto y xRM"
      />
      <div className="space-y-4 p-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Procesos detectados" value={data.counts.total} tone="info" />
          <StatCard
            label="En seguimiento"
            value={data.counts.followed}
            hint={followRate == null ? undefined : `${followRate}% de los detectados`}
            tone="info"
          />
          <StatCard
            label="Próximos a presentarse (7 días)"
            value={data.counts.upcoming7}
            tone="warning"
          />
          <StatCard label="Estudios de mercado" value={data.counts.marketStudies} tone="warning" />
          <StatCard label="Tareas pendientes" value={data.counts.pendingTasks} tone="default" />
          <StatCard
            label="Tareas vencidas"
            value={data.counts.overdueTasks}
            tone={data.counts.overdueTasks > 0 ? "danger" : "success"}
          />
          <StatCard
            label="Presentados en el tablero"
            value={data.presented.length}
            hint="Procesos del listado inferior"
          />
          <StatCard
            label="Valor estimado presentado"
            value={formatCOP(presentedValue)}
            hint="Suma del listado de presentados"
          />
        </div>

        {powerBiUrl && (
          <section className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-sky-600" />
                <h2 className="text-sm font-semibold">Reporte Power BI</h2>
              </div>
              <a
                href={powerBiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                Abrir en pantalla completa <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="overflow-hidden rounded-xl border bg-background">
              <iframe
                title="Reporte Power BI"
                src={powerBiUrl}
                className="aspect-[16/9] w-full border-0"
                allowFullScreen
              />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3 font-medium">Próximos a presentarse</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Proceso</th>
                    <th className="p-3 text-left">Entidad</th>
                    <th className="p-3 text-right">Cierre</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcoming.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="max-w-xs truncate p-3 font-medium">{p.secopTitle ?? "—"}</td>
                      <td className="p-3 text-xs">{p.entityName ?? "—"}</td>
                      <td className="p-3 text-right text-xs whitespace-nowrap">
                        {formatDate(p.closingDate)}
                      </td>
                    </tr>
                  ))}
                  {data.upcoming.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-xs text-muted-foreground" colSpan={3}>
                        Sin procesos próximos a presentarse.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3 font-medium">Procesos presentados</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Proceso</th>
                    <th className="p-3 text-left">Entidad</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.presented.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="max-w-xs truncate p-3">
                        <div className="font-medium">{p.secopTitle ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{p.secopId ?? "—"}</div>
                      </td>
                      <td className="p-3 text-xs">{p.entityName ?? "—"}</td>
                      <td className="p-3 text-right text-xs tabular-nums whitespace-nowrap">
                        {formatCOP(p.estimatedValue)}
                      </td>
                    </tr>
                  ))}
                  {data.presented.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-xs text-muted-foreground" colSpan={3}>
                        Sin procesos presentados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
