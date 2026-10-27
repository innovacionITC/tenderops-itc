"use client";

import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { SemaforoBadge, esColorSemaforo, semaforoEstilos } from "@/app/(app)/secop/semaforo-badge";
import { semaforoLabels } from "@/lib/secop-shared";
import { cn } from "@/lib/utils";

export function ProcessIdentityCell({
  identifier,
  source,
  title,
  entity,
  starred,
}: {
  identifier?: string | null;
  source?: string | null;
  title: string | null | undefined;
  entity?: string | null;
  starred?: boolean;
}) {
  const caption = [identifier, source].filter(Boolean).join(" · ");
  return (
    <div className="min-w-0 py-0.5">
      {caption && (
        <div className="truncate text-[11px] font-medium tracking-wide text-sky-700/80" title={caption}>
          {caption}
        </div>
      )}
      <div className="line-clamp-2 text-sm leading-snug font-semibold text-foreground" title={title ?? undefined}>
        {title || "—"}
      </div>
      <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        {starred && (
          <span title="Entidad registrada en Administración" className="shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </span>
        )}
        <span className="truncate" title={entity ?? undefined}>
          {entity || "—"}
        </span>
      </div>
    </div>
  );
}

export function ProcessTitleCell({
  caption,
  title,
  subtitle,
}: {
  caption?: string | null;
  title: string | null | undefined;
  subtitle?: string | null;
}) {
  return (
    <div className="min-w-0 py-0.5">
      {caption && (
        <div className="truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {caption}
        </div>
      )}
      <div className="line-clamp-2 text-sm leading-snug font-semibold text-foreground" title={title ?? undefined}>
        {title || "—"}
      </div>
      {subtitle && (
        <div className="mt-0.5 truncate text-xs text-muted-foreground" title={subtitle}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function EntityCell({
  name,
  starred,
}: {
  name: string | null | undefined;
  starred?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground">
      {starred && (
        <span title="Entidad registrada en Administración" className="mt-0.5 shrink-0">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        </span>
      )}
      <span className="line-clamp-2" title={name ?? undefined}>
        {name ?? "—"}
      </span>
    </span>
  );
}

export function ProcessFactsCell({
  modalidad,
  estado,
  fase,
  detectado,
}: {
  modalidad?: string | null;
  estado?: ReactNode;
  fase?: string | null;
  detectado?: string | null;
}) {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Modalidad", value: modalidad || "—" },
    { label: "Estado", value: estado || "—" },
    { label: "Fase", value: fase || "—" },
  ];
  if (detectado !== undefined) {
    rows.push({ label: "Detectado", value: detectado || "—" });
  }

  return (
    <dl className="space-y-0.5 text-xs leading-snug">
      {rows.map((row) => (
        <div key={row.label} className="flex min-w-0 gap-1.5">
          <dt className="w-16 shrink-0 text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 truncate font-medium text-foreground" title={typeof row.value === "string" ? row.value : undefined}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function MoneyCell({
  value,
  hint,
}: {
  value: number | string | null | undefined;
  hint?: string | null;
}) {
  const n = typeof value === "string" ? Number(value) : value;
  const amount =
    n == null || !Number.isFinite(n)
      ? "—"
      : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="leading-tight">
      <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">COP</div>
      <div className="text-sm font-semibold tabular-nums text-foreground">{amount}</div>
      {hint && (
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground" title={hint}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function StageCell({
  label,
  hint,
}: {
  label: string | null | undefined;
  hint?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-full border-2 border-sky-500 bg-white shadow-[0_0_0_3px_rgb(186_220_255_/_0.55)]" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground" title={label ?? undefined}>
          {label || "—"}
        </div>
        {hint}
      </div>
    </div>
  );
}

export function SecondaryCell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <span className="line-clamp-2 text-sm leading-snug text-muted-foreground" title={title}>
      {children}
    </span>
  );
}

export function SemaforoMeter({
  semaforo,
  semaforoScore,
  semaforoEstado,
}: {
  semaforo: string | null;
  semaforoScore: number | null;
  semaforoEstado: string | null;
}) {
  if (semaforoEstado !== "clasificado" || !esColorSemaforo(semaforo) || semaforoScore == null) {
    return (
      <SemaforoBadge
        semaforo={semaforo}
        semaforoScore={semaforoScore}
        semaforoEstado={semaforoEstado}
      />
    );
  }

  const pct = Math.max(0, Math.min(100, semaforoScore));
  const estilo = semaforoEstilos[semaforo];

  return (
    <div className="min-w-[6.5rem]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{pct}%</span>
        <span className="text-[10px] font-medium text-muted-foreground">{semaforoLabels[semaforo]}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sky-100/80">
        <div className={cn("h-full rounded-full", estilo.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
