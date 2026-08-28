// Compartido entre la tabla de consulta y la Calculadora plural. Los mensajes de "sin dato" y
// la precisión de COP difieren a propósito entre las dos vistas (ver call sites), por eso se
// parametrizan en vez de fijarse aquí.
export function formatIndicadorValor(
  valor: number | null,
  unidad: string,
  opts?: { emptyText?: string; maxDecimalsCop?: number },
): string {
  if (valor === null) return opts?.emptyText ?? "Sin información";
  if (unidad === "COP") {
    return valor.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: opts?.maxDecimalsCop ?? 2,
    });
  }
  if (unidad === "%") return `${valor.toFixed(3)}%`;
  return valor.toFixed(3);
}
