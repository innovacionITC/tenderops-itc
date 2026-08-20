export type Vista = "activos" | "historicos" | "logrados";

export function parseVista(v: string | undefined): Vista {
  if (v === "historicos") return v;
  if (v === "logrados") return v;
  return "activos";
}
