export type Vista = "detectados" | "descartados" | "vivo" | "sincronizaciones";

// "sincronizaciones" es solo para administradores: quien no lo es cae en la
// vista por defecto en vez de ver una pestaña que no le corresponde.
export function parseVista(v: string | undefined, esAdmin = false): Vista {
  if (v === "vivo" || v === "descartados") return v;
  if (v === "sincronizaciones" && esAdmin) return v;
  return "detectados";
}
