import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/schema";

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

    await db.insert(auditLogs).values({
      userId,
      action: params.action,
      module: params.module ?? null,
      entityType: params.entityType ?? null,
      entityId: isUuid ? raw : null,
      result: params.result ?? "ok",
      metadata: {
        ...(params.metadata ?? {}),
        ...(!isUuid && raw ? { entity_id_raw: raw } : {}),
      },
    });
  } catch (e) {
    console.warn("[audit] no se pudo registrar", e);
  }
}
