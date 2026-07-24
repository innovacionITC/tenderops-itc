import "server-only";
import { db } from "@/db";
import { registrosAuditoria } from "@/db/schema/schema";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Best-effort audit trail. Never throws — a failed audit write must not
// block the mutation it's recording.
export async function recordAudit(
  userId: string,
  params: {
    action: string;
    module?: string;
    entityType?: string | null;
    entityId?: string | null;
    result?: "ok" | "error" | "denegado";
    metadata?: Record<string, unknown>;
  },
) {
  try {
    const raw = params.entityId ?? null;
    const isUuid = typeof raw === "string" && UUID_RE.test(raw);

    await db.insert(registrosAuditoria).values({
      usuarioId: userId,
      accion: params.action,
      modulo: params.module ?? null,
      tipoEntidad: params.entityType ?? null,
      entidadId: isUuid ? raw : null,
      resultado: params.result ?? "ok",
      metadatos: {
        ...(params.metadata ?? {}),
        ...(!isUuid && raw ? { entity_id_raw: raw } : {}),
      },
    });
  } catch (e) {
    console.warn("[audit] no se pudo registrar", e);
  }
}
