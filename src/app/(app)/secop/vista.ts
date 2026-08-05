export type Vista = "detectados" | "monitoreadas" | "vivo";

export function parseVista(v: string | undefined): Vista {
  return v === "monitoreadas" || v === "vivo" ? v : "detectados";
}
