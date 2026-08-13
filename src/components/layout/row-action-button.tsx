import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RowActionButton({
  icon,
  title,
  onClick,
  href,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const className = cn(
    "inline-flex cursor-pointer items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
    disabled && "pointer-events-none cursor-not-allowed opacity-40",
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        aria-label={title}
        className={className}
      >
        {icon}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={className}
    >
      {icon}
    </button>
  );
}
