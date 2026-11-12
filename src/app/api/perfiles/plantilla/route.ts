import { requireAuth } from "@/lib/auth/session";
import { canFollow } from "@/lib/auth/roles";
import { buildImportTemplate } from "@/lib/perfiles/template-excel";

export async function GET() {
  const auth = await requireAuth();
  if (!canFollow(auth.role)) {
    return new Response("No autorizado", { status: 403 });
  }
  const bytes = await buildImportTemplate();
  return new Response(Uint8Array.from(bytes), {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="tenderops-banco-perfiles.xlsx"',
    },
  });
}
