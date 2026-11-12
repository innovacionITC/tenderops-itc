import { requireAuth } from "@/lib/auth/session";
import { apiFetchRaw } from "@/lib/api/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ professionalId: string; resumeId: string }> },
) {
  await requireAuth();
  const { professionalId, resumeId } = await params;
  const upstream = await apiFetchRaw(`/perfiles/${professionalId}/hv/${resumeId}/archivo`);
  if (!upstream.ok) {
    return new Response(upstream.status === 404 ? "Hoja de vida no encontrada" : "No se pudo descargar", {
      status: upstream.status,
    });
  }
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentDisposition) headers.set("content-disposition", contentDisposition);
  return new Response(upstream.body, { status: 200, headers });
}
