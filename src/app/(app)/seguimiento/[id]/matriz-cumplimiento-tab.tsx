"use client";

type AnalisisIa = {
  matrixTotal: number | null;
  matrixCumplidos: number | null;
  matrixPendientes: number | null;
  matrixNoCumple: number | null;
  matrixRiesgoAlto: number | null;
};

export function MatrizCumplimientoTab({ analisis }: { analisis: AnalisisIa | null }) {
  if (!analisis || analisis.matrixTotal === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Ejecuta un análisis IA para ver la matriz de cumplimiento.
      </p>
    );
  }

  const tiles = [
    { label: "Total", value: analisis.matrixTotal, tone: "muted" as const },
    { label: "Cumplidos", value: analisis.matrixCumplidos ?? 0, tone: "success" as const },
    { label: "Pendientes", value: analisis.matrixPendientes ?? 0, tone: "warning" as const },
    { label: "No cumple", value: analisis.matrixNoCumple ?? 0, tone: "danger" as const },
    { label: "Riesgo alto", value: analisis.matrixRiesgoAlto ?? 0, tone: "danger" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="flex flex-col items-center rounded-xl border p-4"
        >
          <span className="text-2xl font-bold">{t.value}</span>
          <span className="mt-1 text-xs text-muted-foreground">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
