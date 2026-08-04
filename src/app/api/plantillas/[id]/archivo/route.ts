import { requireAuth } from "@/lib/auth/session";
import { apiFetchRaw } from "@/lib/api/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAuth();
  const { id } = await params;

  const upstream = await apiFetchRaw(`/plantillas/${id}/archivo`);

  if (!upstream.ok) {
    return new Response(
      upstream.status === 404 ? "Not found" : "Error downloading file",
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
