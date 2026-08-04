import { z } from "zod";

// 25 MB — mantener sincronizado con:
//   next.config.ts  → serverActions.bodySizeLimit ("26mb", 1 MB de margen)
//   Backend          → [RequestSizeLimit] en CreatePlantillaRequest.cs
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"] as const;

export const plantillaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria").max(30, "Máximo 30 caracteres"),
});

const archivoBase = z
  .instanceof(File)
  .refine(
    (f) => f.size <= MAX_FILE_BYTES,
    `El archivo no puede superar los 25 MB`,
  )
  .refine((f) => {
    const name = f.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  }, `Solo se aceptan archivos ${ALLOWED_EXTENSIONS.join(", ")}`);

export const createArchivoSchema = archivoBase.refine(
  (f) => f.size > 0,
  "El archivo es obligatorio",
);

export const archivoSchema = archivoBase;
