export type Tone = "default" | "success" | "warning" | "danger" | "info" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
