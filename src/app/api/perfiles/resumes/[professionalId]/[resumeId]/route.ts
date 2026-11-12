import { requireAuth } from "@/lib/auth/session";
import { PerfilesError } from "@/lib/perfiles/errors";
import { professionalService } from "@/lib/perfiles/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ professionalId: string; resumeId: string }> },
) {
  const auth = await requireAuth();
  const { professionalId, resumeId } = await params;
  try {
    const file = await professionalService().downloadResume(auth, professionalId, resumeId);
    return new Response(Uint8Array.from(file.bytes), {
      status: 200,
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    const status = error instanceof PerfilesError ? error.status : 500;
    const message = error instanceof Error ? error.message : "No se pudo descargar";
    return new Response(message, { status });
  }
}
