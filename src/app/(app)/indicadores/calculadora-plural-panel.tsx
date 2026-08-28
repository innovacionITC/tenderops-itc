"use client";

import { useState, useTransition, useEffect, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ItcTabs, ItcInput, ItcButton, ItcTable, type TableColumn } from "@/components/itc";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { calcularPlural } from "./actions";
import { formatIndicadorValor } from "./format-valor";

type SuborganizacionCol = {
  id: string;
  nombre: string;
};

type IndicadorRow = {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  tipo: string;
  valorOrganizacionPrincipal: number | null;
  valoresSuborganizaciones: {
    suborganizacionId: string;
    suborganizacionNombre: string;
    valor: number | null;
  }[];
  isActive: boolean;
};

type PluralResult = {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  tipo: string;
  valorOrganizacionPrincipal: number | null;
  valoresSuborganizaciones: {
    suborganizacionId: string;
    suborganizacionNombre: string;
    valor: number | null;
  }[];
  valorPlural: number | null;
};

function formatValor(valor: number | null, unidad: string): string {
  return formatIndicadorValor(valor, unidad, { emptyText: "Sin información suficiente", maxDecimalsCop: 3 });
}

export function CalculadoraPluralPanel({
  anio,
  organizationId,
  organizationName,
  suborganizaciones,
}: {
  anio: number;
  organizationId: string;
  organizationName: string;
  suborganizaciones: SuborganizacionCol[];
  indicadores: IndicadorRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [metodo, setMetodo] = useState("ponderado");
  const [participaciones, setParticipaciones] = useState<
    { participanteId: string; participanteNombre: string; porcentaje: string }[]
  >(() => {
    const total = 1 + suborganizaciones.length;
    const pct = Math.floor(100 / total);
    const remainder = 100 - pct * total;
    const parts = [
      { participanteId: organizationId, participanteNombre: organizationName, porcentaje: String(pct + remainder) },
      ...suborganizaciones.map((s) => ({
        participanteId: s.id,
        participanteNombre: s.nombre,
        porcentaje: String(pct),
      })),
    ];
    return parts;
  });
  const [resultados, setResultados] = useState<PluralResult[]>([]);

  const totalPorcentajeRaw = participaciones.reduce((sum, p) => sum + Number(p.porcentaje || 0), 0);
  // Redondeado a 2 decimales para evitar falsos negativos por errores de punto flotante
  // (ej. 33.33 + 33.33 + 33.34 puede no dar exactamente 100 en binario).
  const totalPorcentaje = Math.round(totalPorcentajeRaw * 100) / 100;
  const porcentajeValido = totalPorcentaje === 100;

  const calcular = () => {
    if (!porcentajeValido) return;
    startTransition(async () => {
      try {
        const result = await calcularPlural({
          anio,
          metodo,
          participaciones: participaciones.map((p) => ({
            participanteId: p.participanteId,
            porcentaje: Number(p.porcentaje),
          })),
        });
        setResultados(result.indicadores as PluralResult[]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al calcular");
      }
    });
  };

  // El HU exige recalcular automáticamente tanto al cambiar el método como al ajustar
  // temporalmente la participación — se debounce para no disparar una llamada por cada
  // dígito tecleado en los inputs de porcentaje.
  const participacionesKey = participaciones.map((p) => `${p.participanteId}:${p.porcentaje}`).join("|");
  useEffect(() => {
    if (!porcentajeValido) return;
    const timeout = setTimeout(() => calcular(), 400);
    return () => clearTimeout(timeout);
    // `calcular` se recrea cada render leyendo el estado más reciente; incluirlo en las
    // deps dispararía el efecto en cada render en vez de solo cuando cambian estos valores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodo, participacionesKey, porcentajeValido]);

  const resultColumns: TableColumn<PluralResult>[] = [
    {
      key: "nombre",
      title: "Indicador",
      render: (r) => <span className="font-medium text-sm">{r.nombre}</span>,
    },
    {
      key: "org-principal",
      title: organizationName,
      render: (r) => (
        <span className={`text-sm ${r.valorOrganizacionPrincipal === null ? "italic text-muted-foreground" : ""}`}>
          {formatValor(r.valorOrganizacionPrincipal, r.unidad)}
        </span>
      ),
    },
    ...suborganizaciones.map((suborg) => ({
      key: `suborg-${suborg.id}`,
      title: suborg.nombre,
      render: (r: PluralResult) => {
        const v = r.valoresSuborganizaciones.find((vs) => vs.suborganizacionId === suborg.id);
        const val = v?.valor ?? null;
        return (
          <span className={`text-sm ${val === null ? "italic text-muted-foreground" : ""}`}>
            {formatValor(val, r.unidad)}
          </span>
        );
      },
    })),
    {
      key: "plural",
      title: "Plural",
      render: (r) => (
        <span className={`text-sm font-semibold ${r.valorPlural === null ? "italic text-muted-foreground" : ""}`}>
          {formatValor(r.valorPlural, r.unidad)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div>
        <Label className="mb-1.5">Año</Label>
        <ItcInput value={String(anio)} disabled />
      </div>

      <div>
        <Label className="mb-1.5">Método</Label>
        <ItcTabs
          variant="segmented"
          activeKey={metodo}
          onChange={setMetodo}
          items={[
            { key: "ponderado", label: "Ponderado" },
            { key: "sumado", label: "Sumado" },
          ]}
          hideContent
        />
      </div>

      <div className="space-y-2">
        <Label className="mb-1.5">Participación (%)</Label>
        {participaciones.map((p, idx) => (
          <div key={p.participanteId} className="flex items-center gap-2">
            <span className="flex-1 text-sm truncate" title={p.participanteNombre}>
              {p.participanteNombre}
            </span>
            <ItcInput
              type="number"
              className="w-24"
              value={p.porcentaje}
              onChange={(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                const next = [...participaciones];
                next[idx] = { ...next[idx], porcentaje: e.target.value };
                setParticipaciones(next);
              }}
              suffix="%"
            />
          </div>
        ))}
        {!porcentajeValido && (
          <p className="text-xs text-destructive">
            La suma de porcentajes debe ser exactamente 100% (actual: {totalPorcentaje}%)
          </p>
        )}
      </div>

      <ItcButton
        onClick={calcular}
        disabled={!porcentajeValido || isPending}
        className="w-full"
      >
        {isPending ? <Spinner className="size-3.5" /> : null}
        Calcular
      </ItcButton>

      {resultados.length > 0 && (
        <ItcTable
          data={resultados}
          columns={resultColumns}
          rowKey={(r) => r.id}
          striped
          hoverable
          stickyHeader
        />
      )}
    </div>
  );
}
