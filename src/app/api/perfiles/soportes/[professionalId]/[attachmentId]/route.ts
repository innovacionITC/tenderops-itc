import { requireAuth } from "@/lib/auth/session";
import { PerfilesError } from "@/lib/perfiles/errors";
import { professionalService } from "@/lib/perfiles/server";
import { createSupabaseStorage } from "@/lib/perfiles/supabase-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ professionalId: string; attachmentId: string }> },
) {
  const auth = await requireAuth();
  const { professionalId, attachmentId } = await params;
  try {
    const record = await professionalService().get(auth, professionalId);
    const attachment = record.attachments.find((item) => item.id === attachmentId);
    if (!attachment?.storagePath) {
      return new Response("Soporte no encontrado", { status: 404 });
    }
    const bytes = await createSupabaseStorage().download(attachment.storagePath);
    return new Response(Uint8Array.from(bytes), {
      status: 200,
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": `attachment; filename="${attachment.name}"`,
      },
    });
  } catch (error) {
    const status = error instanceof PerfilesError ? error.status : 500;
    const message = error instanceof Error ? error.message : "No se pudo descargar";
    return new Response(message, { status });
  }
}
