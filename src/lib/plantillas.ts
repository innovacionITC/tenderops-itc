import "server-only";
import { apiFetch } from "@/lib/api/client";

type PlantillaResponse = {
  id: string;
  name: string;
  description: string | null;
  fileName: string | null;
};

export type PlantillaRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  archivo: string | null;
};

export async function listPlantillas(): Promise<PlantillaRow[]> {
  const rows = await apiFetch<PlantillaResponse[]>("/plantillas");

  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    descripcion: r.description ?? null,
    archivo: r.fileName ?? null,
  }));
}
