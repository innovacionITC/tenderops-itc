export type Vista = "detectados" | "vivo";

export function parseVista(v: string | undefined): Vista {
  return v === "vivo" ? v : "detectados";
}
