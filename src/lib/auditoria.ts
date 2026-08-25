import "server-only";
import { apiFetch } from "@/lib/api/client";
import type { Paginado } from "@/lib/secop-shared";
import type { AuditoriaRow } from "@/lib/auditoria-shared";

type AuditoriaListResponse = {
  items: AuditoriaRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listAuditoria(params: {
  userId?: string;
  module?: string;
  action?: string;
  from?: string;
  to?: string;
  role?: string;
  operationType?: string;
  result?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginado<AuditoriaRow>> {
  const query: Record<string, string | number | undefined> = {};
  if (params.userId) query.userId = params.userId;
  if (params.module) query.module = params.module;
  if (params.action) query.action = params.action;
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.role) query.role = params.role;
  if (params.operationType) query.operationType = params.operationType;
  if (params.result) query.result = params.result;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;

  const res = await apiFetch<AuditoriaListResponse>("/auditoria", { query });
  return {
    items: res.items,
    total: res.total,
    page: res.page,
    pageSize: res.pageSize,
  };
}
