import { requireAuth } from "@/lib/auth/session";
import { apiFetchRaw } from "@/lib/api/client";

// Plantilla oficial de Excel de la base de conocimiento, llena con los datos
// vigentes. Pasa por aquí para que el navegador no necesite el token de la API.
export async function GET() {
  await requireAuth();

  const upstream = await apiFetchRaw("/conocimiento-licitaciones/plantilla");

  if (!upstream.ok) {
    return new Response(
      upstream.status === 403 ? "Forbidden" : "Error downloading file",
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentDisposition) headers.set("content-disposition", contentDisposition);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);

  return new Response(upstream.body, { status: 200, headers });
}
