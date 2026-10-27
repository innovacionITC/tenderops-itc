import type { Tone } from "./status-badge";

const ACCENT_CLASSES: Record<Tone, string> = {
  default: "bg-border",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
  info: "bg-sky-500",
  muted: "bg-muted-foreground/40",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="crystal-surface relative overflow-hidden rounded-3xl p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5">
      <span
        className={`absolute top-3 bottom-3 left-0 w-1 rounded-r-full ${ACCENT_CLASSES[tone]}`}
      />
      <div className="pl-2">
        <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}
