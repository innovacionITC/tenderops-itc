import "server-only";
import { apiFetch } from "@/lib/api/client";

type PlantillaResponse = {
  id: string;
  name: string;
  description: string | null;
  fileName: string | null;
  isActive: boolean;
  createdAt: string;
};

export type PlantillaRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  archivo: string | null;
  estado: boolean;
  createdAt: string;
};

export async function listPlantillas(): Promise<PlantillaRow[]> {
  const rows = await apiFetch<PlantillaResponse[]>("/plantillas");

  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    descripcion: r.description ?? null,
    archivo: r.fileName ?? null,
    estado: r.isActive,
    createdAt: r.createdAt,
  }));
}
